import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAuthenticated } from "@/lib/auth"
import { createPost } from "@/lib/posts"
import { readCategoryList } from "@/lib/categories"
import { slugify } from "@/lib/utils"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { addPlan } from "@/lib/autopost-jobs"

export const maxDuration = 120

// Pexels API로 이미지 검색 (API 키 없으면 picsum 사용)
async function fetchImage(query: string, seed: string): Promise<string> {
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    try {
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
  return `https://picsum.photos/seed/${seed}/1200/630`
}

interface PostSpec {
  category: string
  topic: string
}

const POST_SPECS: PostSpec[] = [
  { category: "AI", topic: "ai" },
  { category: "재테크", topic: "finance" },
  { category: "대출/국가제도", topic: "loan" },
  { category: "이슈", topic: "issue" },
]

function resolveCategory(specCategory: string, list: string[]): string {
  if (list.includes(specCategory)) return specCategory
  const lower = specCategory.toLowerCase()
  const found = list.find(c => c.toLowerCase() === lower)
  if (found) return found
  // For AI, find the AI category
  if (specCategory === "AI") {
    const aiCat = list.find(c => c.toLowerCase() === "ai")
    if (aiCat) return aiCat
  }
  // For others, return as-is (admin can create the category)
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

// 선호 순서대로 시도할 Flash 모델 목록
const FLASH_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
]

/** Google Models API로 현재 실제 사용 가능한 Flash 모델을 찾아 반환 */
async function findBestFlashModel(apiKey: string): Promise<string> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}&pageSize=100`
    )
    if (res.ok) {
      const data = await res.json()
      const available: string[] = (data.models ?? [])
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes("generateContent")
        )
        .map((m: { name: string }) => m.name.replace("models/", ""))

      for (const candidate of FLASH_CANDIDATES) {
        if (available.includes(candidate)) return candidate
        const match = available.find((n) => n.startsWith(candidate))
        if (match) return match
      }
    }
  } catch {}
  return FLASH_CANDIDATES[0]
}

/** Google v1 REST API 직접 호출 (SDK v1beta 우회) */
async function generateWithV1Fetch(apiKey: string, spec: PostSpec, modelName: string) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`
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
    throw new Error(`${modelName} v1 오류 ${res.status}: ${errText}`)
  }
  const data = await res.json()
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error(`${modelName} 응답에 텍스트가 없습니다.`)
  return parseResponse(text.trim())
}

/** Google v1beta REST API - Google Search grounding 포함 (이슈 전용) */
async function generateIssuePost(keywords: string[]): Promise<ParsedPost> {
  const apiKey = process.env.GEMINI_API_KEY!
  const model = "gemini-2.0-flash"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const keywordStr = keywords.join(", ")
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })

  const prompt = `당신은 한국의 인기 블로거입니다. 오늘 날짜: ${today}

다음 키워드들로 최신 뉴스를 검색하고, 독자가 흥미를 느끼고 공유하고 싶어지는 재미있고 유익한 한국어 블로그 포스트를 작성하세요.

키워드: ${keywordStr}

⚠️ 중요 지침:
1. 제목에 연도 숫자 넣지 말 것
2. "완벽 정리", "총정리", "꿀팁", "충격", "경악" 같은 낚시성 단어 금지
3. 실제 최신 데이터·수치·사실을 반드시 포함 (검색 결과 기반)
4. 독자가 "오 이거 친구한테 공유해야 해!"라고 느낄 만큼 흥미롭고 유익하게
5. 판에 박힌 "안녕하세요, 오늘은 ~에 대해 알아보겠습니다" 시작 금지

【본문 구조】
1. 강렬한 도입부 (독자가 바로 빠져들도록)
2. <h2> 소제목 5개 이상, 각 250자 이상
3. 실제 최신 사실·수치·사례 포함
4. FAQ: <h2>자주 묻는 질문</h2> + <h3>Q. 질문</h3><p>A. 답변</p> 형식, 3개 이상
5. 마무리: 핵심 요약 + 독자 행동 유도

반드시 아래 JSON 형식으로만 응답 (마크다운 코드블록 없이 순수 JSON):
{
  "title": "SEO 최적화 제목 — 순수 텍스트만, HTML 태그 절대 금지 (연도 없이)",
  "excerpt": "검색 결과 요약, 독자 클릭 유도, 2문장 이내 80자",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "imageKeywords": "english image search keywords",
  "content": "HTML 본문 전체 (h2·h3·p·ul·li·strong 활용, FAQ 포함)"
}

⚠️ JSON 출력 규칙:
- content 필드는 반드시 마지막에 위치
- HTML 태그 속성(href, src 등)은 큰따옴표 대신 작은따옴표 사용
- content 값 안에 큰따옴표(") 사용 금지 — &quot; 또는 작은따옴표로 대체
- 줄바꿈 없이 content 전체를 한 줄 문자열로 출력`

  const body = {
    tools: [{ googleSearch: {} }],
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 8192 },
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`이슈 포스팅 생성 오류 ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("이슈 포스팅 응답에 텍스트가 없습니다.")
  return parseResponse(text.trim())
}

async function generatePost(spec: PostSpec, keywords?: string[]): Promise<ParsedPost> {
  // 이슈 타입은 Google Search grounding 사용
  if (spec.topic === "issue" && keywords && keywords.length > 0) {
    return generateIssuePost(keywords)
  }

  const apiKey = process.env.GEMINI_API_KEY!
  const genAI = new GoogleGenerativeAI(apiKey)

  const modelName = await findBestFlashModel(apiKey)

  let lastError: Error | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await generateWithModel(genAI, modelName, spec)
    } catch (e) {
      lastError = e as Error
      const msg = lastError.message ?? ""
      const isRetryable = is503(msg) || msg.includes("429") || msg.includes("Too Many")
      if (isRetryable && attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 7000))
        continue
      }
      break
    }
  }

  return await generateWithV1Fetch(apiKey, spec, modelName)
}

// ── 주제 배열 ─────────────────────────────────────────────────────────────────

const AI_TOPICS = [
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
  "프롬프트를 잘 쓰는 사람과 못 쓰는 사람의 차이는 뭘까",
  "AI가 틀린 정보를 자신 있게 말하는 이유 (환각 현상 이해하기)",
  "GPT와 LLM이 글을 만드는 원리: 토큰과 확률로 이해하기",
  "RAG란 무엇인가: AI가 최신 정보를 아는 방법",
  "멀티모달 AI란? 텍스트·이미지·음성을 동시에 처리하는 AI",
  "AI로 유튜브 스크립트 초안 쓰고 내 목소리로 다듬는 방법",
  "AI 이미지 생성에서 저작권 문제가 생기는 상황과 피하는 법",
  "ChatGPT로 영어 이메일 쓰는 법: 격식체·비격식체 프롬프트 예시",
  "AI 때문에 수요가 줄어드는 직업 vs 오히려 중요해지는 직업",
  "학생이 AI를 사용하는 것, 어디까지가 정직한 사용일까",
  "Ollama로 내 PC에서 AI 모델 무료로 돌리는 방법 (설치부터 실행까지)",
  "무료로 쓸 수 있는 AI 툴 7가지: 돈 안 내도 이 정도는 된다",
  "ChatGPT Plus vs Claude Pro vs Gemini Advanced: 유료 AI 뭐가 나을까",
  "AI 검색 Perplexity vs 구글 검색, 실제로 써보니 이런 차이가 있었다",
  "AI에게 개인정보 입력해도 괜찮을까? 보안 주의사항 정리",
  "딥페이크란 무엇이고 어떻게 구분하는가",
]

const FINANCE_TOPICS = [
  "주식 계좌 처음 여는 법: 증권사 비교부터 첫 매수까지 순서 정리",
  "S&P500 ETF 처음 사는 방법: 어떤 앱에서 어떻게 주문하나",
  "배당주란 무엇인가: 배당금이 실제로 언제 얼마나 들어오는지",
  "ETF와 펀드의 차이: 어떤 상황에서 어떤 걸 선택해야 할까",
  "ISA 계좌 개설하고 ETF 사는 구체적인 방법 (화면 순서 설명)",
  "IRP 계좌에서 퇴직연금 수익률 높이는 상품 배분 방법",
  "연금저축펀드로 세액공제 받는 방법과 한도 계산법",
  "직장인이 연말정산에서 가장 많이 놓치는 소득공제 항목들",
  "의료비 공제 대상이 되는 것과 안 되는 것 구분하기",
  "청년형 장기집합투자증권저축으로 세금 줄이는 방법",
  "파킹통장 vs CMA vs 고금리 적금: 단기 자금 어디에 넣는 게 나을까",
  "적금 이자 계산법: 연 5% 적금이 실제로 손에 쥐는 돈은 얼마인가",
  "청약통장 점수 높이는 방법: 납입 횟수와 금액 전략",
  "전세 vs 월세, 재무적으로 어느 쪽이 내게 유리한지 판단하는 법",
  "생애 첫 주택 구매할 때 받을 수 있는 대출 종류 정리",
  "월급날 통장 쪼개는 법: 저축·생활비·비상금 비율 정하기",
  "신용카드 포인트와 캐시백, 어떤 카드 조합이 실제로 유리한가",
  "지출을 줄이고 싶은데 왜 잘 안 될까: 소비 심리 이해하기",
  "국민연금 예상 수령액 조회하는 법과 부족분 채우는 방법",
  "실손보험 갱신 보험료가 오르는 이유와 대처 방법",
  "직장인이 현실적으로 할 수 있는 부업 종류와 실제 수익 이야기",
  "FIRE 운동이란 무엇이고, 실제로 실행 가능한 방법인가",
  "주식 투자에서 손절을 못 하는 심리적 이유와 극복법",
  "투자를 시작했다가 포기하는 사람들의 공통적인 패턴",
  "달러 환율이 내 투자에 어떤 영향을 주는지 이해하기",
  "비트코인 사고 싶은데 얼마나 어떻게 접근하는 게 합리적일까",
]

const LOAN_TOPICS = [
  "청년 전월세 대출 신청 방법: 자격부터 서류까지 한 번에",
  "버팀목 전세자금 대출 조건과 금리 비교",
  "디딤돌 구입자금 대출 신청 방법 및 한도 정리",
  "청년 월세 지원 신청 방법: 조건·신청처·유의사항",
  "주택청약 종합저축 가입과 1순위 조건 만드는 방법",
  "중소기업 취업 청년 전세대출 자격과 신청 절차",
  "신혼부부 전세자금 대출 종류와 금리 비교",
  "보금자리론 신청 방법과 고정금리 장점",
  "생애최초 주택 구입 취득세 감면 받는 방법",
  "근로장려금 신청 방법과 지급 기준",
  "자녀장려금 신청 조건과 신청 기간 정리",
  "청년도약계좌 가입 조건과 정부 기여금 계산",
  "청년희망적금 vs 청년도약계좌: 어떤 게 더 유리한가",
  "기초생활수급자 조건과 혜택 정리",
  "차상위계층 신청 방법과 받을 수 있는 지원",
  "국민취업지원제도 신청 방법과 구직촉진수당",
  "실업급여 신청 방법과 수급 기간 계산",
  "육아휴직급여 신청 방법과 지급액 계산",
  "출산 전후 휴가급여 신청 조건과 금액",
  "노인 장기요양보험 신청 절차와 등급 기준",
  "장애인 등록 절차와 받을 수 있는 복지 혜택",
  "소상공인 정책 자금 대출 신청 방법",
  "창업 초기 지원금: 정부 지원 창업 프로그램 정리",
  "주거급여 신청 방법과 지원 금액",
  "에너지 바우처 신청 조건과 지원 내용",
  "문화누리카드 신청 방법과 사용처",
  "저금리 대환대출 프로그램: 고금리 대출 낮추는 방법",
  "햇살론 신청 자격과 금리 조건",
  "서민금융진흥원 대출 종류와 신청 방법",
  "국가장학금 신청 방법과 소득분위 계산",
  "학자금 대출 종류 비교: 취업 후 상환 vs 일반 상환",
  "청년 창업 지원금 받는 방법: 정부 프로그램 총정리",
]

// ISSUE_TOPICS는 사용자 키워드로 override됨 (placeholder)
const ISSUE_TOPICS: string[] = []

// 제목 패턴
const TITLE_PATTERNS = [
  "질문형 — 독자가 검색할 법한 질문 그대로 제목으로 (예: 'ChatGPT는 정말 글을 잘 쓸까?')",
  "How-to형 — 구체적 행동 제시 (예: '~하는 법', '~하는 방법')",
  "숫자 리스트형 — 구체적 숫자 포함 (예: '처음 알게 된 3가지', 'N단계로 이해하기')",
  "비교형 — 두 대상 맞대결 (예: 'A vs B, 실제로 써보니')",
  "경험담형 — 직접 해본 이야기 (예: '직접 써봤더니', '한 달 써본 후기')",
  "문제해결형 — 독자의 고민을 제목으로 (예: '~때문에 고민이라면', '~이 어려운 이유')",
  "입문 가이드형 — 처음 시작하는 사람 대상 (예: '처음 시작하는 ~', '~입문: 기초부터')",
]

// 문체 페르소나
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

function getTopicList(topic: string): string[] {
  switch (topic) {
    case "ai": return AI_TOPICS
    case "finance": return FINANCE_TOPICS
    case "loan": return LOAN_TOPICS
    case "issue": return ISSUE_TOPICS
    default: return AI_TOPICS
  }
}

function buildPrompt(spec: PostSpec): string {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
  const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const topicList = getTopicList(spec.topic)
  const chosenTopic = rand(topicList.length > 0 ? topicList : AI_TOPICS)
  const chosenAngle = rand(ANGLES)
  const chosenTitlePattern = rand(TITLE_PATTERNS)
  const chosenPersona = rand(WRITING_PERSONAS)

  let audienceGuide: string
  switch (spec.topic) {
    case "ai":
      audienceGuide = "타겟 독자: AI 처음 접하는 입문자 ~ 실무에서 활용하는 직장인"
      break
    case "finance":
      audienceGuide = "타겟 독자: 재테크 이제 시작하거나 더 잘하고 싶은 2030~40대 직장인"
      break
    case "loan":
      audienceGuide = "타겟 독자: 대출·정부지원제도를 처음 알아보는 2030 청년 및 서민"
      break
    default:
      audienceGuide = "타겟 독자: 다양한 연령대의 한국 블로그 독자"
  }

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
  "title": "SEO 최적화 제목 — 순수 텍스트만, HTML 태그 절대 금지 (연도 없이)",
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
  const stripped = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  try {
    const match = stripped.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as ParsedPost
  } catch { /* fallback below */ }

  const markerRe = /"content"\s*:\s*"/
  const markerMatch = markerRe.exec(stripped)
  if (!markerMatch) throw new Error("Gemini 응답에서 JSON을 파싱할 수 없습니다.")

  const contentStart = markerMatch.index + markerMatch[0].length

  const lastBrace = stripped.lastIndexOf("}")
  let contentEnd = lastBrace - 1
  while (contentEnd > contentStart && stripped[contentEnd] !== '"') contentEnd--
  if (contentEnd <= contentStart) throw new Error("Gemini content 필드 끝을 찾을 수 없습니다.")

  const content = stripped.slice(contentStart, contentEnd)

  const head = stripped.slice(0, markerMatch.index)
  const get = (re: RegExp) => {
    const m = re.exec(head)
    return m ? m[1].replace(/\\"/g, '"').replace(/\\n/g, "\n") : ""
  }

  const tagsMatch = /"tags"\s*:\s*(\[[^\]]*\])/.exec(head)
  let tags: string[] = []
  try { if (tagsMatch) tags = JSON.parse(tagsMatch[1]) } catch {}

  const stripTags = (s: string) => s.replace(/<[^>]*>/g, "").trim()
  return {
    title: stripTags(get(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/) ),
    excerpt: stripTags(get(/"excerpt"\s*:\s*"((?:[^"\\]|\\.)*)"/) ),
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

// ── 카테고리 라벨 ──────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  ai: "AI 포스팅",
  finance: "재테크 포스팅",
  loan: "대출/국가제도",
  issue: "이슈 포스팅",
}

export { generatePost, buildPrompt, parseResponse, fetchImage, resolveCategory, POST_SPECS, ISSUE_TOPICS, TYPE_LABELS }
export type { PostSpec, ParsedPost }

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
  let count: number = 1
  let scheduled: boolean = false
  let keywords: string[] = []

  try {
    const body = await req.json()
    type = body.type ?? "all"
    count = Math.min(Math.max(Number(body.count) || 1, 1), 1000)
    scheduled = !!body.scheduled
    keywords = Array.isArray(body.keywords) ? body.keywords.slice(0, 10) : []
  } catch {}

  const categoryList = await readCategoryList()

  // Determine which specs to use
  let specs: PostSpec[]
  if (type === "all") {
    specs = POST_SPECS.map(s => ({ ...s, category: resolveCategory(s.category, categoryList) }))
  } else {
    const topicMap: Record<string, string> = {
      ai: "ai",
      finance: "finance",
      loan: "loan",
      issue: "issue",
    }
    const topicKey = topicMap[type] ?? "ai"
    const baseSpec = POST_SPECS.find(s => s.topic === topicKey)
    if (!baseSpec) {
      return NextResponse.json({ ok: false, error: "알 수 없는 타입입니다." }, { status: 400 })
    }
    specs = [{ ...baseSpec, category: resolveCategory(baseSpec.category, categoryList) }]
  }

  const results: Array<{ category: string; title: string; slug: string }> = []
  const errors: Array<{ category: string; error: string }> = []

  // Determine immediate count (first post always immediate; remaining batched or looped)
  const immediateCount = scheduled ? 1 : Math.min(count, 5)
  const remainingCount = count - immediateCount

  // Generate immediate posts
  for (let i = 0; i < immediateCount; i++) {
    for (const spec of specs) {
      try {
        const generated = await generatePost(spec, spec.topic === "issue" ? keywords : undefined)

        const imageSeed = `${spec.category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const thumbnail = await fetchImage(generated.imageKeywords || spec.topic, imageSeed)

        const today = new Date().toISOString()
        const slug =
          slugify(generated.title) ||
          `${spec.category.toLowerCase()}-${today}-${Math.random().toString(36).slice(2, 6)}`

        const post = await createPost({
          slug,
          title: generated.title,
          date: today,
          category: spec.category,
          tags: generated.tags,
          excerpt: generated.excerpt,
          thumbnail,
          published: true,
          content: generated.content,
        })

        results.push({ category: spec.category, title: post.title, slug: post.slug })
      } catch (e) {
        errors.push({
          category: spec.category,
          error: (e as Error)?.message || "알 수 없는 오류",
        })
      }
    }
  }

  // Create scheduled plan for remaining posts
  let plan = null
  if (remainingCount > 0 && scheduled) {
    const intervalMs = Math.floor(Math.random() * (6 * 3600000 - 4 * 3600000 + 1)) + 4 * 3600000
    const nextAt = new Date(Date.now() + intervalMs).toISOString()
    const planType = (type === "all" ? "ai" : type) as "ai" | "finance" | "loan" | "issue"

    plan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: planType,
      label: TYPE_LABELS[planType] ?? planType,
      totalCount: count,
      publishedCount: immediateCount * specs.length,
      keywords,
      intervalMs,
      nextAt,
      createdAt: new Date().toISOString(),
    }

    await addPlan(plan)
  }

  revalidatePath("/", "layout")

  return NextResponse.json({ ok: true, results, errors, plan })
}
