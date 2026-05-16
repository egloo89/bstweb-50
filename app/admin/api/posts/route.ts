import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { getAllPosts, createPost } from "@/lib/posts"
import { slugify } from "@/lib/utils"

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }
  const posts = getAllPosts(true)
  return NextResponse.json({ ok: true, posts })
}

export async function POST(req: Request) {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }
  try {
    const body = await req.json()
    if (!body.title) {
      return NextResponse.json({ ok: false, error: "제목이 필요합니다." }, { status: 400 })
    }
    const slug = slugify(body.slug || body.title) || `post-${Date.now()}`
    const post = createPost({
      slug,
      title: body.title,
      date: body.date,
      category: body.category || "기타",
      tags: body.tags || [],
      excerpt: body.excerpt || "",
      thumbnail: body.thumbnail || "",
      published: body.published !== false,
      content: body.content || "",
    })
    return NextResponse.json({ ok: true, post })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "생성 실패" }, { status: 400 })
  }
}
