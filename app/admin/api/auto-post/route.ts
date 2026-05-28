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
      return await generateWithModel(genAI, "gemini-2.5-flash", spec)
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

// 다양한 주제·각도 배열 (호출 때마다 랜덤 선택 → 획일화 방지)
const AI_TOPICS = [
  "ChatGPT 실전 활용법 (특정 기능·플러그인·GPT 커스텀)",
  "Claude AI 사용법 및 ChatGPT와 차이점 비교",
  "Gemini·Copilot 등 최신 AI 어시스턴트 완전 정복",
  "Midjourney·DALL-E·Stable Diffusion 이미지 생성 AI 튜토리얼",
  "AI 프롬프트 엔지니어링 기초부터 고급까지",
  "Notion AI·Google Workspace AI 등 생산성 툴 활용",
  "AI 코딩 어시스턴트(Cursor, GitHub Copilot) 실전 가이드",
  "영상·음악 생성 AI 툴(Sora, Runway, Suno) 사용법",
  "AI로 블로그·SNS 콘텐츠 자동화하는 방법",
  "AI 번역·글쓰기 도구 비교 및 활용 전략",
  "챗봇 직접 만들기 (노코드 AI 서비스 활용)",
  "AI 기초 개념 쉽게 이해하기 (LLM·딥러닝·머신러닝)",
  "AI가 바꾸는 직업·산업 트렌드 분석",
  "AI 윤리·저작권·개인정보 문제 총정리",
  "교육 현장에서 AI 활용하는 법 (학생·교사 모두)",
  "의료·법률·금융 분야 AI 도입 현황과 활용법",
  "AI로 副業(부업) 수익 만드는 실전 방법",
  "로컬 AI(Ollama 등) 내 PC에서 무료로 쓰는 방법",
  "AI 검색(Perplexity·SearchGPT) vs 구글 검색 비교",
  "AI 자동화로 반복 업무 없애는 워크플로우 구축법",
]

const FINANCE_TOPICS = [
  "국내 주식 가치투자 입문 (재무제표 읽는 법)",
  "ETF 투자 완전 정복 (S&P500·나스닥·국내 ETF 비교)",
  "배당주 투자로 월세 받는 포트폴리오 구성법",
  "ISA 계좌 완벽 활용법 (절세 + 투자 동시에)",
  "연말정산 환급 최대로 받는 꿀팁 총정리",
  "IRP·퇴직연금 운용 전략 (수익률 높이는 방법)",
  "청약 통장 전략 및 아파트 청약 당첨 가이드",
  "전세 vs 월세 vs 매매 재무적 분석 및 선택 기준",
  "파킹통장·CMA·MMF 단기 자금 굴리는 법",
  "신용카드 혜택 극대화 전략 (캐시백·마일리지·할인)",
  "금리 인상·인하 시기별 재테크 전략 변화",
  "환율 변동 시 외화 예금·달러 투자 하는 법",
  "적금 vs 예금 vs 채권 금리 비교 및 선택 가이드",
  "부업으로 월 50만 원 더 버는 현실적인 방법들",
  "FIRE족 되기 위한 조기 은퇴 로드맵",
  "가계부 쓰는 법과 지출 구조 최적화 전략",
  "국민연금 수령액 늘리는 방법과 노후 준비",
  "암호화폐·비트코인 기초 및 안전하게 투자하는 법",
  "소비 심리 극복하고 저축 습관 만드는 실전 방법",
  "사회초년생 첫 월급 재테크 로드맵 (순서대로 따라하기)",
]

// 제목 패턴 다양화: 호출마다 랜덤 선택
const TITLE_PATTERNS = [
  "질문형: 독자가 궁금해할 질문으로 시작 (예: '왜 ~할까?', '~해도 될까?')",
  "How-to형: 구체적 방법 제시 (예: '~하는 법', '~하는 방법 완전 정리')",
  "리스트형: 숫자 포함 (예: '~하는 N가지 방법', 'N단계로 ~하기')",
  "비교형: 두 가지 대상 비교 (예: 'A vs B', 'A와 B의 차이')",
  "스토리형: 경험담 형식 (예: '직접 써봤더니', '써보니 달랐던 점')",
  "문제해결형: 통증 포인트 해소 (예: '~때문에 고민이라면', '~없이 ~하는 법')",
  "가이드형: 완전 입문 가이드 (예: '~입문 가이드', '처음 시작하는 ~')",
]

const ANGLES = [
  "완전 초보도 따라할 수 있는 단계별 튜토리얼 (스크린샷·예시 포함 묘사)",
  "직접 사용해본 경험 후기 + 장단점 솔직 비교",
  "전문가가 잘 알려주지 않는 핵심 노하우·팁",
  "초보자가 흔히 저지르는 실수와 피하는 방법",
  "구체적 수치·사례로 증명하는 실전 전략",
  "시간·비용을 아끼는 효율적인 방법 집중 분석",
  "기본 개념부터 응용까지 체계적으로 설명하는 완전 정복 가이드",
]

function buildPrompt(spec: PostSpec): string {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
  const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const topicList = spec.topic === "AI" ? AI_TOPICS : FINANCE_TOPICS
  const chosenTopic = rand(topicList)
  const chosenAngle = rand(ANGLES)
  const chosenTitlePattern = rand(TITLE_PATTERNS)

  const audienceGuide = spec.topic === "AI"
    ? "타겟 독자: AI 입문자부터 실무 활용자까지 폭넓게"
    : "타겟 독자: 재테크 초보 ~ 중급 투자자 (2030~40대)"

  return `당신은 구글·네이버 SEO 전문가이자 애드센스 승인 경험이 풍부한 한국어 블로그 작가입니다.
오늘 날짜: ${today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 이번 포스팅 지정 주제·각도·제목 패턴
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
주제: ${chosenTopic}
글쓰기 각도: ${chosenAngle}
제목 패턴: ${chosenTitlePattern}
${audienceGuide}

⚠️ 금지 사항 (반드시 지킬 것):
1. 제목에 연도(2025, 2026 등) 넣지 말 것 — 연도 제목은 시간이 지나면 구식이 됨
2. "업무효율화", "사회초년생 재테크 기초", "완벽 정리" 같은 진부한 제목 금지
3. "~꿀팁", "~모르면 손해", "~충격" 같은 낚시성 표현 금지
4. 지정 주제에서 벗어나지 말 것

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 구글 E-E-A-T + 애드센스 승인 조건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【제목 작성 기준】
- 40자 이내, 주제 핵심 키워드 포함
- 위에서 지정한 "제목 패턴"에 맞는 형식으로 작성
- 연도 없이도 충분히 매력적인 시간초월 제목 (Evergreen)
- 독자가 실제로 검색할 법한 자연스러운 키워드

【본문 구조 - E-E-A-T 충족 (경험·전문성·권위·신뢰)】
1. 도입부: 독자가 공감할 구체적 상황·문제 묘사 (2~3문장, "저도 처음엔..." 식 경험담 포함)
2. 본론: <h2> 소제목 6개 이상, 각 소제목 아래 250자 이상 설명
   - 실제 경험·사례 기반의 구체적 설명 (수치·예시 포함)
   - <ul><li> 리스트로 핵심 포인트 정리
   - <strong>으로 핵심 단어 강조 (문단당 1~2회, 자연스럽게)
   - 독자가 바로 따라할 수 있는 실행 가능한 내용
3. FAQ 섹션: <h2>자주 묻는 질문</h2> + <h3>Q. 질문</h3><p>A. 답변</p> 형식, 3개 이상
4. 마무리: 핵심 내용 1~2줄 요약 + 독자 다음 행동 유도

【글 품질 기준】
- 3000자 이상 (충분한 정보량)
- 복사·번역 금지, 저자가 직접 경험한 듯한 독창적 시각
- 정확한 정보, 구체적 수치나 근거 포함
- 광고성·자극적 표현 없는 신뢰감 있는 문체

【이미지 키워드】
- 포스트 내용과 딱 맞는 영어 검색어 2~3단어
- Pexels 고품질 사진 검색에 적합한 단어

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
