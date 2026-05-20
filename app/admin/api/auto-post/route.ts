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

async function generatePost(spec: PostSpec) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

  let lastError: Error | null = null
  for (const modelName of MODELS) {
    try {
      return await generateWithModel(genAI, modelName, spec)
    } catch (e) {
      lastError = e as Error
      const msg = lastError.message ?? ""
      if (
        msg.includes("503") ||
        msg.includes("overloaded") ||
        msg.includes("high demand") ||
        msg.includes("Service Unavailable")
      ) {
        continue
      }
      throw e
    }
  }
  throw lastError
}

async function generateWithModel(genAI: GoogleGenerativeAI, modelName: string, spec: PostSpec) {
  const model = genAI.getGenerativeModel({ model: modelName })

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const categoryGuide = spec.topic === "AI"
    ? `카테고리: AI / 기술
주제 범위: AI 에이전트, 생성형 AI, ChatGPT·Gemini·Claude 활용법, 업무 자동화, AI 툴 비교, 코딩 AI, 이미지 생성 AI 등
독자: AI에 관심 있는 일반인부터 실무자까지`
    : `카테고리: 재테크 / 금융
주제 범위: 주식·ETF 투자, 적금·예금 전략, 절세 방법, 부업·수익화, 가계부·지출 관리, 청약·부동산 기초, 연금 등
독자: 사회초년생부터 30~40대 직장인까지`

  const prompt = `당신은 네이버 블로그 상위 노출 전문가이자 콘텐츠 마케터입니다. 오늘 날짜: ${today}

${categoryGuide}

아래 조건을 모두 충족하는 블로그 포스트를 작성하세요.

【제목 조건 - 클릭률(CTR) 극대화】
- 숫자를 포함하거나 ("7가지", "3단계", "월 100만원") 강한 궁금증을 유발
- "모르면 손해", "지금 당장", "2026년 최신", "실전", "완벽 정리" 등 긴박감·혜택 강조 표현 활용
- 40자 이내, 검색 키워드 포함
- 예시 형식: "2026년 직장인이 반드시 알아야 할 ETF 투자 7가지 전략"

【본문 조건 - 체류시간 극대화】
- 2000자 이상
- <h2> 소제목 6개 이상 (각 소제목 아래 충분한 설명)
- 독자가 즉시 실행 가능한 구체적 방법·수치·예시 포함
- 리스트(<ul><li>)로 핵심 정보를 스캔하기 쉽게
- 첫 단락에 독자의 공감을 끌어내는 문장 포함
- 마지막 단락에 행동 유도 문장 포함

【이미지 키워드 조건】
- 포스트 내용과 정확히 어울리는 영어 검색어 2~3단어
- Pexels에서 검색 시 고품질 사진이 나올 법한 구체적 키워드
- 예: "stock market charts", "robot technology future", "money savings piggy bank"

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이 순수 JSON):
{
  "title": "클릭률 높은 포스트 제목",
  "excerpt": "포스트 핵심 요약 (독자가 읽고 싶어지는 2문장, 80자 이내)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "imageKeywords": "영어 이미지 검색 키워드",
  "content": "HTML 본문 전체"
}`

  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()

  const stripped = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("Gemini 응답에서 JSON을 찾을 수 없습니다.")
  const jsonStr = match[0]

  const parsed = JSON.parse(jsonStr) as {
    title: string
    excerpt: string
    tags: string[]
    imageKeywords: string
    content: string
  }

  return parsed
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
  try { const body = await req.json(); type = body.type ?? "all" } catch {}

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

      const today = new Date().toISOString().split("T")[0]
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

  revalidatePath("/", "layout")

  return NextResponse.json({ ok: true, results, errors })
}
