import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAuthenticated } from "@/lib/auth"
import { createPost } from "@/lib/posts"
import { slugify } from "@/lib/utils"
import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 120

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Pexels API로 이미지 검색 (API 키 없으면 picsum 사용)
async function fetchImage(query: string, seed: string): Promise<string> {
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: pexelsKey } }
      )
      const data = await res.json()
      if (data.photos?.length > 0) {
        return data.photos[0].src.large2x
      }
    } catch {}
  }
  // 키 없으면 picsum (seed로 항상 같은 이미지)
  return `https://picsum.photos/seed/${seed}/1200/630`
}

interface PostSpec {
  category: string
  topic: string
  imageQuery: string
  imageSeed: string
}

const POST_SPECS: PostSpec[] = [
  {
    category: "AI",
    topic: "최신 AI 툴 및 트렌드 (AI 에이전트, 생성형 AI, 로봇 등)",
    imageQuery: "artificial intelligence robot technology",
    imageSeed: `ai-${Date.now()}`,
  },
  {
    category: "재테크",
    topic: "재테크 전략 (주식, ETF, 절세, 저축 등 현실적인 재테크 방법)",
    imageQuery: "investment finance money savings",
    imageSeed: `finance-${Date.now()}`,
  },
]

async function generatePost(spec: PostSpec) {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `당신은 한국어 블로그 전문 작가입니다. 오늘 날짜는 ${today}입니다.

다음 주제로 블로그 포스트를 작성해주세요: **${spec.topic}**

요구사항:
- 언어: 한국어
- 분량: 1500자 이상 (글자 수 충분히)
- 소제목: 5개 이상 (## 마크다운 형식)
- 최신 트렌드와 실용적인 정보 중심
- 독자가 바로 활용할 수 있는 구체적인 내용
- 친근하고 읽기 쉬운 문체

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이 순수 JSON):
{
  "title": "포스트 제목",
  "excerpt": "포스트 요약 (2-3문장, 80자 이내)",
  "tags": ["태그1", "태그2", "태그3"],
  "content": "HTML 형식의 본문 (h2 소제목 5개 이상, p 태그, ul/li 목록 등 활용)"
}

content는 HTML 형식으로 작성하되, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> 태그를 사용하세요.`,
      },
    ],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()

  // JSON 파싱 (코드블록 제거 후)
  const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim()
  const parsed = JSON.parse(jsonStr) as {
    title: string
    excerpt: string
    tags: string[]
    content: string
  }

  return parsed
}

export async function POST() {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다." },
      { status: 500 }
    )
  }

  const results: Array<{ category: string; title: string; slug: string }> = []
  const errors: Array<{ category: string; error: string }> = []

  for (const spec of POST_SPECS) {
    try {
      const [generated, thumbnail] = await Promise.all([
        generatePost(spec),
        fetchImage(spec.imageQuery, spec.imageSeed),
      ])

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
