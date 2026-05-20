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

function buildPrompt(spec: PostSpec): string {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
  const categoryGuide = spec.topic === "AI"
    ? `카테고리: AI / 기술\n주제 범위: AI 에이전트, 생성형 AI, ChatGPT·Gemini·Claude 활용법, 업무 자동화, AI 툴 비교, 코딩 AI, 이미지 생성 AI 등\n타겟 독자: AI에 관심 있는 일반인 ~ 실무자`
    : `카테고리: 재테크 / 금융\n주제 범위: 주식·ETF 투자, 적금·예금 전략, 절세, 부업·수익화, 가계부, 청약·부동산 기초, 연금\n타겟 독자: 사회초년생 ~ 30~40대 직장인`

  return `당신은 구글·네이버 SEO 전문가이자 애드센스 승인 경험이 풍부한 한국어 블로그 작가입니다.
오늘 날짜: ${today}

${categoryGuide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 구글 애드센스 승인 + SEO 최적화 조건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【제목】
- 40자 이내, 메인 키워드 포함
- 숫자("7가지", "3단계")·혜택("모르면 손해", "완벽 정리", "실전")으로 CTR 극대화
- 중복 없는 고유한 주제 선택

【본문 구조 - E-E-A-T 충족 (구글 품질 기준)】
1. 도입부: 독자의 고민/문제를 공감하는 2~3문장
2. 본론: <h2> 소제목 6개 이상, 각 소제목 아래 200자 이상 설명
   - 구체적 수치, 실제 사례, 단계별 방법 포함
   - <ul><li> 리스트로 핵심 정보 시각화
   - <strong>으로 핵심 키워드 강조 (자연스럽게, 과도하지 않게)
3. FAQ 섹션: <h2>자주 묻는 질문</h2> + <h3>질문</h3><p>답변</p> 형식으로 3개 이상
4. 마무리: 핵심 요약 + 독자 행동 유도 문장

【애드센스 승인 필수 조건】
- 2500자 이상 (충분한 콘텐츠 양)
- 복사·번역 금지, 반드시 독창적이고 유익한 내용
- 광고성·낚시성 표현 금지
- 정확한 정보, 출처 신뢰성 있는 내용

【이미지 키워드】
- 포스트 핵심 내용과 딱 맞는 영어 검색어 2~3단어
- Pexels 고품질 사진 검색에 적합한 키워드

반드시 아래 JSON 형식으로만 응답 (마크다운 코드블록 없이 순수 JSON):
{
  "title": "SEO 최적화 고CTR 제목",
  "excerpt": "검색 결과에 표시될 핵심 요약 (독자 클릭 유도, 2문장, 80자 이내)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "imageKeywords": "영어 이미지 검색 키워드",
  "content": "HTML 본문 전체 (h2·h3·p·ul·li·strong·em 활용, FAQ 섹션 포함)"
}`
}

function parseResponse(raw: string) {
  const stripped = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("Gemini 응답에서 JSON을 찾을 수 없습니다.")
  return JSON.parse(match[0]) as {
    title: string; excerpt: string; tags: string[]; imageKeywords: string; content: string
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
