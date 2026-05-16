import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getAllPosts, updatePost } from "@/lib/posts"

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

    const postA = allPosts[idx]
    const postB = allPosts[swapIdx]
    updatePost(postA.slug, { ...postA, date: postB.date })
    updatePost(postB.slug, { ...postB, date: postA.date })

    revalidatePath("/", "layout")
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
