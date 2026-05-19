import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAuthenticated } from "@/lib/auth"
import { getPostBySlug, updatePost, deletePost } from "@/lib/posts"
import { slugify } from "@/lib/utils"

function unauthorized() {
  return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  if (!isAuthenticated()) return unauthorized()
  const post = await getPostBySlug(params.slug)
  if (!post) return NextResponse.json({ ok: false, error: "찾을 수 없음" }, { status: 404 })
  return NextResponse.json({ ok: true, post })
}

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  if (!isAuthenticated()) return unauthorized()
  try {
    const body = await req.json()
    const newSlug = slugify(body.slug || params.slug) || params.slug
    const updated = await updatePost(params.slug, {
      slug: newSlug,
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
    return NextResponse.json({ ok: true, post: updated })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || "수정 실패" }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { slug: string } }) {
  if (!isAuthenticated()) return unauthorized()
  const ok = await deletePost(params.slug)
  if (!ok) return NextResponse.json({ ok: false, error: "찾을 수 없음" }, { status: 404 })
  revalidatePath("/", "layout")
  return NextResponse.json({ ok: true })
}
