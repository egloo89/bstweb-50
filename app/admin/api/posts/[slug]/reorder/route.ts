import { NextResponse } from "next/server"
import { getAllPosts, updatePost, getPostBySlug } from "@/lib/posts"

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const { direction } = await req.json()
    const allPosts = getAllPosts(true)
    const idx = allPosts.findIndex((p) => p.slug === params.slug)
    if (idx === -1) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })

    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= allPosts.length) {
      return NextResponse.json({ ok: false, error: "Cannot move" }, { status: 400 })
    }

    // Swap dates between the two posts to change display order
    const postA = allPosts[idx]
    const postB = allPosts[swapIdx]
    const dateA = postA.date
    const dateB = postB.date

    updatePost(postA.slug, { ...postA, tags: postA.tags, date: dateB })
    updatePost(postB.slug, { ...postB, tags: postB.tags, date: dateA })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
