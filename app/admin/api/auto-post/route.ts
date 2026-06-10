import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAuthenticated } from "@/lib/auth"
import { createPost } from "@/lib/posts"
import { readCategoryList } from "@/lib/categories"
import { slugify } from "@/lib/utils"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 120

// Pexels API로 이미지 검색 (API 키 없으면 picsum 사용)
async function fetchImage(query: string, seed: string): Promise<string> {
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    try {
      // 매번 다른 이미지를 위해 랜덤 page 사용
      const page = Math.floor(Math.random() * 5) + 1
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`,
        { headers: { Authorization: pexelsKey } }
      )
      const data = await res.json()
      if (data.photos?.length > 0) {
        const idx = Math.floor(Math.random() * data.photos.length)
        return data.photos[idx].src.large2x
      }
    } catch {}
  }
  // picsum: seed마다 다른 이미지
  return `https://picsum.photos/seed/${seed}/1200/630`
}

interface PostSpec {
  category: string
  topic: string
}

const POST_SPECS: PostSpec[] = [
  {
    category: "AI",
    topic: "AI",
  },
  {
    category: "재테크",
    topic: "재테크",
  },
]

function resolveCategory(specCategory: string, list: string[]): string {
  if (list.includes(specCategory)) return specCategory
  const lower = specCategory.toLowerCase()
  const found = list.find(c => c.toLowerCase() === lower)
  if (found) return found
  if (specCategory !== "AI") {
    const nonAi = list.find(c => c.toLowerCase() !== "ai")
    if (nonAi) return nonAi
  }
  return specCategory
}

function is503(msg: string) {
  return (
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("high demand") ||
    msg.includes("Service Unavailable")
  )
}

/** SDK 우회: Google v1 REST API 직접 호출 (gemini-1.5-flash 안정 버전) */
async function generateWithV1Fetch(apiKey: string, spec: PostSpec) {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(spec) }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`gemini-1.5-flash v1 오류 ${res.status}: ${errText}`)
  }
  const data = await res.json()
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("gemini-1.5-flash 응답에 텍스트가 없습니다.")
  return parseResponse(text.trim())
}

async function generatePost(spec: PostSpec) {
  const apiKey = process.env.GEMINI_API_KEY!
  const genAI = new GoogleGenerativeAI(apiKey)

  // 1차: gemini-2.5-flash (v1beta) — 3회 시도
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await generateWithModel(genAI, "gemini-2.0-flash", spec)
    } catch (e) {
      const msg = (e as Error).message ?? ""
      if ((is503(msg) || msg.includes("429") || msg.includes("Too Many")) && attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 7000)) // 7초, 14초
        continue
      }
      if (!is503(msg) && !msg.includes("429")) throw e
    }
  }

  // 2차 폴백: gemini-1.5-flash v1 REST API 직접 호출 (SDK 우회)
  return await generateWithV1Fetch(apiKey, spec)
}

// ── 주제 배열: 매우 구체적인 서브토픽으로 세분화 (획일화 방지) ──────────────
const AI_TOPICS = [
  // 도구 사용법 — 각 툴 고유 기능에 집중
  "ChatGPT Custom GPT 만드는 법: 반복 프롬프트 없애는 나만의 AI 비서",
  "Claude AI 프로젝트 기능 활용법: 맥락 유지하며 긴 작업 처리하기",
  "Perplexity AI로 논문·기사 빠르게 검색하고 출처까지 확인하는 법",
  "Notion AI vs Obsidian AI: 개인 지식 관리 도구로 뭐가 더 나을까",
  "Cursor AI로 코딩 경험 없이 웹사이트 만들어본 솔직 후기",
  "Midjourney로 블로그 썸네일 직접 만드는 과정 (프롬프트 예시 포함)",
  "Suno AI로 유튜브 배경음악 무료로 만드는 방법",
  "Runway Gen-3으로 짧은 영상 만들어본 경험담",
  "Google NotebookLM으로 긴 PDF 요약하고 질문하는 법",
  "Microsoft Copilot이 Excel에서 실제로 해주는 것과 못 해주는 것",
  // 개념·원리 — 쉽게 풀어쓰기
  "프롬프트를 잘 쓰는 사람과 못 쓰는 사람의 차이는 뭘까",
  "AI가 틀린 정보를 자신 있게 말하는 이유 (환각 현상 이해하기)",
  "GPT와 LLM이 글을 만드는 원리: 토큰과 확률로 이해하기",
  "RAG란 무엇인가: AI가 최신 정보를 아는 방법",
  "멀티모달 AI란? 텍스트·이미지·음성을 동시에 처리하는 AI",
  // 창작·콘텐츠
  "AI로 유튜브 스크립트 초안 쓰고 내 목소리로 다듬는 방법",
  "AI 이미지 생성에서 저작권 문제가 생기는 상황과 피하는 법",
  "ChatGPT로 영어 이메일 쓰는 법: 격식체·비격식체 프롬프트 예시",
  // 직업·사회적 영향
  "AI 때문에 수요가 줄어드는 직업 vs 오히려 중요해지는 직업",
  "학생이 AI를 사용하는 것, 어디까지가 정직한 사용일까",
  // 무료·로컬
  "Ollama로 내 PC에서 AI 모델 무료로 돌리는 방법 (설치부터 실행까지)",
  "무료로 쓸 수 있는 AI 툴 7가지: 돈 안 내도 이 정도는 된다",
  // 비교·선택
  "ChatGPT Plus vs Claude Pro vs Gemini Advanced: 유료 AI 뭐가 나을까",
  "AI 검색 Perplexity vs 구글 검색, 실제로 써보니 이런 차이가 있었다",
  // 보안·윤리
  "AI에게 개인정보 입력해도 괜찮을까? 보안 주의사항 정리",
  "딥페이크란 무엇이고 어떻게 구분하는가",
]

const FINANCE_TOPICS = [
  // 투자 입문 — 아주 구체적인 첫 단계
  "주식 계좌 처음 여는 법: 증권사 비교부터 첫 매수까지 순서 정리",
  "S&P500 ETF 처음 사는 방법: 어떤 앱에서 어떻게 주문하나",
  "배당주란 무엇인가: 배당금이 실제로 언제 얼마나 들어오는지",
  "ETF와 펀드의 차이: 어떤 상황에서 어떤 걸 선택해야 할까",
  // 절세 계좌 — 구체적 사용법
  "ISA 계좌 개설하고 ETF 사는 구체적인 방법 (화면 순서 설명)",
  "IRP 계좌에서 퇴직연금 수익률 높이는 상품 배분 방법",
  "연금저축펀드로 세액공제 받는 방법과 한도 계산법",
  // 세금·공제
  "직장인이 연말정산에서 가장 많이 놓치는 소득공제 항목들",
  "의료비 공제 대상이 되는 것과 안 되는 것 구분하기",
  "청년형 장기집합투자증권저축으로 세금 줄이는 방법",
  // 예·적금·단기 자금
  "파킹통장 vs CMA vs 고금리 적금: 단기 자금 어디에 넣는 게 나을까",
  "적금 이자 계산법: 연 5% 적금이 실제로 손에 쥐는 돈은 얼마인가",
  // 부동산·청약
  "청약통장 점수 높이는 방법: 납입 횟수와 금액 전략",
  "전세 vs 월세, 재무적으로 어느 쪽이 내게 유리한지 판단하는 법",
  "생애 첫 주택 구매할 때 받을 수 있는 대출 종류 정리",
  // 소비·지출 관리
  "월급날 통장 쪼개는 법: 저축·생활비·비상금 비율 정하기",
  "신용카드 포인트와 캐시백, 어떤 카드 조합이 실제로 유리한가",
  "지출을 줄이고 싶은데 왜 잘 안 될까: 소비 심리 이해하기",
  // 노후·보험
  "국민연금 예상 수령액 조회하는 법과 부족분 채우는 방법",
  "실손보험 갱신 보험료가 오르는 이유와 대처 방법",
  // 부업·소득
  "직장인이 현실적으로 할 수 있는 부업 종류와 실제 수익 이야기",
  "FIRE 운동이란 무엇이고, 실제로 실행 가능한 방법인가",
  // 투자 심리·습관
  "주식 투자에서 손절을 못 하는 심리적 이유와 극복법",
  "투자를 시작했다가 포기하는 사람들의 공통적인 패턴",
  "달러 환율이 내 투자에 어떤 영향을 주는지 이해하기",
  "비트코인 사고 싶은데 얼마나 어떻게 접근하는 게 합리적일까",
]

// 제목 패턴 — 매번 다른 형식 강제
const TITLE_PATTERNS = [
  "질문형 — 독자가 검색할 법한 질문 그대로 제목으로 (예: 'ChatGPT는 정말 글을 잘 쓸까?')",
  "How-to형 — 구체적 행동 제시 (예: '~하는 법', '~하는 방법')",
  "숫자 리스트형 — 구체적 숫자 포함 (예: '처음 알게 된 3가지', 'N단계로 이해하기')",
  "비교형 — 두 대상 맞대결 (예: 'A vs B, 실제로 써보니')",
  "경험담형 — 직접 해본 이야기 (예: '직접 써봤더니', '한 달 써본 후기')",
  "문제해결형 — 독자의 고민을 제목으로 (예: '~때문에 고민이라면', '~이 어려운 이유')",
  "입문 가이드형 — 처음 시작하는 사람 대상 (예: '처음 시작하는 ~', '~입문: 기초부터')",
]

// 문체 페르소나 — 공통 AI 문체 탈피
const WRITING_PERSONAS = [
  "경험 공유형: 직접 겪은 이야기를 솔직하게 나누는 친근한 이웃 같은 문체. '저도 처음엔 이게 뭔지 몰랐는데요', '막상 써보니 이런 점이 좋았어요'처럼 1인칭 경험 기반으로 서술. 존댓말 유지.",
  "차분한 전문가형: 데이터와 수치를 근거로 신뢰감 있게 설명하는 문체. '실제 테스트 결과', '수치로 보면'처럼 근거 중심. 감탄사·과장 없이 담백하게.",
  "독자 대화형: 독자에게 직접 말 거는 따뜻한 문체. '혹시 이런 경험 있으신가요?', '한 번 같이 생각해봐요'처럼 독자를 글 속으로 끌어들이는 방식.",
  "스토리텔링형: 하나의 구체적인 상황을 이야기로 풀어가는 문체. 문제 발생 → 시도 → 결과의 흐름으로 서술. 독자가 장면을 상상할 수 있도록 묘사.",
  "실용 가이드형: 군더더기 없이 핵심만 전달하는 명료한 문체. 불필요한 서론 없이 바로 본론, 단계별 지시와 체크리스트 중심. '먼저 ~하세요', '다음으로 ~' 형식.",
]

const ANGLES = [
  "완전 초보 대상 — 용어 설명부터 시작해 따라할 수 있는 단계별 설명",
  "직접 사용 경험 기반 — 써본 사람만 아는 솔직한 장단점 비교",
  "흔한 오해·실수 교정 — 많은 사람이 잘못 알고 있는 부분을 짚어줌",
  "구체적 수치와 사례 중심 — 추상적 설명 없이 숫자와 실제 사례로만 증명",
  "의사결정 도움 — 독자가 선택해야 하는 상황에서 판단 기준 제시",
  "단계별 실행 가이드 — 지금 당장 따라할 수 있는 순서와 방법",
  "개념 이해 중심 — 원리를 이해해야 응용이 된다는 관점에서 깊이 설명",
]

function buildPrompt(spec: PostSpec): string {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
  const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const topicList = spec.topic === "AI" ? AI_TOPICS : FINANCE_TOPICS
  const chosenTopic = rand(topicList)
  const chosenAngle = rand(ANGLES)
  const chosenTitlePattern = rand(TITLE_PATTERNS)
  const chosenPersona = rand(WRITING_PERSONAS)

  const audienceGuide = spec.topic === "AI"
    ? "타겟 독자: AI 처음 접하는 입문자 ~ 실무에서 활용하는 직장인"
    : "타겟 독자: 재테크 이제 시작하거나 더 잘하고 싶은 2030~40대 직장인"

  return `당신은 구글·네이버 SEO를 잘 아는 한국어 블로그 필자입니다. 오늘 날짜: ${today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 이번 글의 설정값 (모두 반드시 반영)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
주제: ${chosenTopic}
글쓰기 각도: ${chosenAngle}
제목 패턴: ${chosenTitlePattern}
글쓰기 페르소나(문체): ${chosenPersona}
${audienceGuide}

⚠️ 절대 금지 사항:
1. 제목에 연도(2024, 2025, 2026…) 넣지 말 것
2. "완벽 정리", "총정리", "꿀팁", "모르면 손해", "충격" 등 낚시성 단어 금지
3. 위 주제에서 벗어나거나 주제를 일반화하지 말 것
4. 모든 글이 똑같은 패턴("~란 무엇인가, ~의 장점, ~주의사항, 마무리")으로 시작하는 구조 금지
5. 도입부에서 "안녕하세요, 오늘은 ~에 대해 알아보겠습니다" 같은 판에 박힌 시작 금지

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 구글 E-E-A-T 기준 + 애드센스 승인 조건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【제목】
- 지정된 "제목 패턴"에 맞게 작성 (패턴을 벗어나지 말 것)
- 40자 이내, 독자가 실제로 검색할 만한 자연스러운 키워드 포함
- 연도 없이도 매력적인 Evergreen 제목

【문체】
- 반드시 위에서 지정한 "글쓰기 페르소나"의 문체로 일관되게 작성
- 글마다 다른 느낌이 나야 함 — AI가 쓴 것 같은 획일적 문체 금지

【본문 구조 (E-E-A-T 충족)】
1. 도입부: 독자가 공감할 구체적 상황을 짧고 강렬하게 — 위에서 지정한 페르소나 문체로 시작
2. 본론: <h2> 소제목 6개 이상, 각 소제목 아래 250자 이상
   - 구체적 수치·사례·실행 가능한 내용 포함
   - <ul><li>로 핵심 포인트 정리, <strong>으로 키워드 강조 (과도하지 않게)
3. FAQ: <h2>자주 묻는 질문</h2> + <h3>Q. 질문</h3><p>A. 답변</p> 형식, 3개 이상
4. 마무리: 핵심 요약 1~2줄 + 독자가 지금 당장 할 수 있는 행동 유도

【품질 기준】
- 3000자 이상 / 복사·번역 금지 / 독창적 시각
- 정확한 정보, 구체적 근거 포함 / 광고성·자극적 표현 없음

【이미지 키워드】
- 포스트 핵심 내용에 딱 맞는 영어 검색어 2~3단어 (Pexels 검색용)

반드시 아래 JSON 형식으로만 응답 (마크다운 코드블록 없이 순수 JSON):
{
  "title": "SEO 최적화 제목 (연도 없이)",
  "excerpt": "검색 결과 요약, 독자 클릭 유도, 2문장 이내 80자",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "imageKeywords": "english image search keywords",
  "content": "HTML 본문 전체 (h2·h3·p·ul·li·strong 활용, FAQ 포함)"
}

⚠️ JSON 출력 규칙:
- content 필드는 반드시 마지막에 위치
- HTML 태그 속성(href, src 등)은 큰따옴표 대신 작은따옴표 사용 (예: <a href='url'>)
- content 값 안에 큰따옴표(") 사용 금지 — &quot; 또는 작은따옴표로 대체
- 줄바꿈 없이 content 전체를 한 줄 문자열로 출력`
}

type ParsedPost = { title: string; excerpt: string; tags: string[]; imageKeywords: string; content: string }

function parseResponse(raw: string): ParsedPost {
  // 마크다운 코드블록 제거
  const stripped = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  // 1) 표준 JSON.parse 시도 (정상 케이스)
  try {
    const match = stripped.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as ParsedPost
  } catch { /* 아래 fallback으로 */ }

  // 2) 강건한 폴백: content 필드는 항상 마지막이므로
  //    앞쪽 단순 필드는 regex로 추출, content는 수동 슬라이싱으로 처리
  //    (HTML 속성 큰따옴표로 인한 JSON parse 오류 방지)
  const markerRe = /"content"\s*:\s*"/
  const markerMatch = markerRe.exec(stripped)
  if (!markerMatch) throw new Error("Gemini 응답에서 JSON을 파싱할 수 없습니다.")

  const contentStart = markerMatch.index + markerMatch[0].length

  // JSON 끝 부분: ...content값..." \n}  — 마지막 } 앞의 " 위치를 찾음
  const lastBrace = stripped.lastIndexOf("}")
  let contentEnd = lastBrace - 1
  while (contentEnd > contentStart && stripped[contentEnd] !== '"') contentEnd--
  if (contentEnd <= contentStart) throw new Error("Gemini content 필드 끝을 찾을 수 없습니다.")

  const content = stripped.slice(contentStart, contentEnd)

  // content 이전 부분에서 나머지 필드 추출
  const head = stripped.slice(0, markerMatch.index)
  const get = (re: RegExp) => {
    const m = re.exec(head)
    return m ? m[1].replace(/\\"/g, '"').replace(/\\n/g, "\n") : ""
  }

  const tagsMatch = /"tags"\s*:\s*(\[[^\]]*\])/.exec(head)
  let tags: string[] = []
  try { if (tagsMatch) tags = JSON.parse(tagsMatch[1]) } catch {}

  return {
    title: get(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/),
    excerpt: get(/"excerpt"\s*:\s*"((?:[^"\\]|\\.)*)"/),
    tags,
    imageKeywords: get(/"imageKeywords"\s*:\s*"((?:[^"\\]|\\.)*)"/),
    content,
  }
}

async function generateWithModel(genAI: GoogleGenerativeAI, modelName: string, spec: PostSpec) {
  const model = genAI.getGenerativeModel({ model: modelName })
  const result = await model.generateContent(buildPrompt(spec))
  return parseResponse(result.response.text().trim())
}

export async function POST(req: Request) {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다." },
      { status: 500 }
    )
  }

  let type: string = "all"
  let scheduledAt: string | undefined
  try {
    const body = await req.json()
    type = body.type ?? "all"
    scheduledAt = body.scheduledAt ?? undefined
  } catch {}

  const categoryList = await readCategoryList()
  const allSpecs = POST_SPECS.map(s => ({ ...s, category: resolveCategory(s.category, categoryList) }))
  const specs = type === "ai"
    ? allSpecs.filter(s => s.category.toLowerCase() === "ai")
    : type === "finance"
    ? allSpecs.filter(s => s.category.toLowerCase() !== "ai")
    : allSpecs

  const results: Array<{ category: string; title: string; slug: string }> = []
  const errors: Array<{ category: string; error: string }> = []

  for (const spec of specs) {
    try {
      // 먼저 포스트 생성 (이미지 키워드 포함)
      const generated = await generatePost(spec)

      // 생성된 키워드로 이미지 검색 (포스팅마다 다른 이미지)
      const imageSeed = `${spec.category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const thumbnail = await fetchImage(generated.imageKeywords || spec.topic, imageSeed)

      const today = new Date().toISOString() // 날짜+시간 전체 저장
      const slug =
        slugify(generated.title) ||
        `${spec.category.toLowerCase()}-${today}-${Math.random().toString(36).slice(2, 6)}`

      const isScheduled = !!scheduledAt
      const post = await createPost({
        slug,
        title: generated.title,
        date: today,
        category: spec.category,
        tags: generated.tags,
        excerpt: generated.excerpt,
        thumbnail,
        published: !isScheduled,
        content: generated.content,
        ...(isScheduled ? { scheduledAt } : {}),
      })

      results.push({ category: spec.category, title: post.title, slug: post.slug })
    } catch (e) {
      errors.push({
        category: spec.category,
        error: (e as Error)?.message || "알 수 없는 오류",
      })
    }
  }

  revalidatePath("/", "layout")

  return NextResponse.json({ ok: true, results, errors })
}
