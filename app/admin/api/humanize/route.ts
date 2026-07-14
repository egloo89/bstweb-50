import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAuthenticated } from "@/lib/auth"
import { getAllPosts, updatePost } from "@/lib/posts"

export const maxDuration = 60

const KV_HUMANIZED_KEY = "bstweb_humanized_slugs"

async function getRedis() {
  try {
    const { Redis } = await import("@upstash/redis")
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    if (url && token) return new Redis({ url, token })
    return Redis.fromEnv()
  } catch {
    return null
  }
}

async function getHumanizedSet(): Promise<Set<string>> {
  const r = await getRedis()
  if (!r) return new Set()
  try {
    const v = await r.get<string[]>(KV_HUMANIZED_KEY)
    return new Set(Array.isArray(v) ? v : [])
  } catch {
    return new Set()
  }
}

async function markHumanized(slug: string) {
  const r = await getRedis()
  if (!r) return
  try {
    const set = await getHumanizedSet()
    set.add(slug)
    await r.set(KV_HUMANIZED_KEY, [...set])
  } catch {}
}

// v1 REST에서 사용 가능한 flash 모델 자동 탐지
const FLASH_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
]

async function findModel(apiKey: string): Promise<string> {
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
      for (const c of FLASH_CANDIDATES) {
        if (available.includes(c)) return c
        const match = available.find(n => n.startsWith(c))
        if (match) return match
      }
      const anyFlash = available.find(n => n.includes("flash"))
      if (anyFlash) return anyFlash
    }
  } catch {}
  return FLASH_CANDIDATES[0]
}

function buildHumanizePrompt(title: string, category: string, html: string): string {
  return `당신은 실제 경험을 바탕으로 글을 쓰는 한국의 블로거입니다. 아래 블로그 글을 "사람이 직접 쓴 것처럼" 자연스럽게 다시 써 주세요.

[제목] ${title}
[카테고리] ${category}

[다시 쓰기 규칙]
1. AI가 쓴 티(과장된 도입부, "~해볼까요?", "함께 알아봐요", "지금 바로 시작해보세요" 같은 판에 박힌 표현)를 모두 제거하세요.
2. 1인칭 관점과 솔직한 어조를 넣으세요. ("나도 직접 해보니", "처음엔 헷갈렸는데" 등) — 단, 억지스럽지 않게 자연스럽게.
3. 문장을 자연스럽게 다듬되, 본문의 사실·수치·핵심 정보는 그대로 유지하세요. 정보를 지어내지 마세요.
4. 소제목 구조(h2)는 유지하되, 표현은 더 사람답게 바꾸세요.
5. 불필요하게 반복되는 마무리 멘트, 감탄사, 이모지는 줄이세요.
6. 재테크·대출·금융 주제라면 과장된 수익 약속이나 단정적 표현을 피하고 정보 제공 톤을 유지하세요.

[출력 형식]
- 오직 HTML 본문만 출력하세요. <h2>, <h3>, <p>, <ul>, <li>, <strong> 태그를 사용하세요.
- 마크다운 코드블록(\`\`\`)이나 설명 문구 없이, HTML만 바로 출력하세요.
- <h1>이나 제목은 넣지 마세요 (제목은 별도 관리됩니다).

[원본 HTML]
${html}`
}

async function humanizeContent(apiKey: string, model: string, title: string, category: string, html: string): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildHumanizePrompt(title, category, html) }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 8192 },
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  let text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  text = text.trim()
  // 코드블록 펜스 제거
  text = text.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim()
  // 최소 검증: 문단 태그가 있어야 정상
  if (!text.includes("<p") && !text.includes("<h2")) return null
  return text
}

export async function POST() {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 400 })
  }

  const [posts, humanized] = await Promise.all([getAllPosts(true), getHumanizedSet()])
  const published = posts.filter(p => p.published)
  const pending = published.filter(p => !humanized.has(p.slug))

  const total = published.length
  const alreadyDone = total - pending.length

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, done: true, total, processed: 0, remaining: 0, results: [] })
  }

  const model = await findModel(apiKey)

  // 타임아웃 방지: 한 번에 1개씩만 처리 (프론트에서 반복 호출)
  const batch = pending.slice(0, 1)
  const results: Array<{ slug: string; title: string; ok: boolean }> = []

  for (const post of batch) {
    try {
      const newContent = await humanizeContent(apiKey, model, post.title, post.category, post.content)
      if (newContent) {
        await updatePost(post.slug, {
          slug: post.slug,
          title: post.title,
          date: post.date,
          category: post.category,
          tags: post.tags,
          excerpt: post.excerpt,
          thumbnail: post.thumbnail,
          published: post.published,
          content: newContent,
        })
        await markHumanized(post.slug)
        results.push({ slug: post.slug, title: post.title, ok: true })
      } else {
        // 실패해도 무한루프 방지를 위해 humanized 처리(원본 유지)
        await markHumanized(post.slug)
        results.push({ slug: post.slug, title: post.title, ok: false })
      }
    } catch {
      await markHumanized(post.slug)
      results.push({ slug: post.slug, title: post.title, ok: false })
    }
  }

  revalidatePath("/", "layout")

  const remaining = pending.length - batch.length
  return NextResponse.json({
    ok: true,
    done: remaining === 0,
    total,
    alreadyDone,
    processed: batch.length,
    remaining,
    results,
  })
}

// 진행 상태 확인용
export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const [posts, humanized] = await Promise.all([getAllPosts(true), getHumanizedSet()])
  const published = posts.filter(p => p.published)
  const done = published.filter(p => humanized.has(p.slug)).length
  return NextResponse.json({ ok: true, total: published.length, done, remaining: published.length - done })
}
