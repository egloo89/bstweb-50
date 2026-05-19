import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAuthenticated } from "@/lib/auth"
import { getAllPosts, createPost } from "@/lib/posts"
import { slugify } from "@/lib/utils"

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }
  return NextResponse.json({ ok: true, posts: await getAllPosts(true) })
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
    const post = await createPost({
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
    revalidatePath("/", "layout")
    return NextResponse.json({ ok: true, post })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || "생성 실패" }, { status: 400 })
  }
}
