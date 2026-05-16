import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { writeCategoryRename } from "@/lib/categories"
import { getAllPosts, updatePost } from "@/lib/posts"

export async function POST(req: Request) {
  try {
    const { oldName, newName } = await req.json()
    if (!oldName || !newName || typeof oldName !== "string" || typeof newName !== "string") {
      return NextResponse.json({ ok: false, error: "잘못된 형식" }, { status: 400 })
    }
    const trimmedNew = newName.trim()
    if (!trimmedNew) {
      return NextResponse.json({ ok: false, error: "이름이 비어있습니다" }, { status: 400 })
    }

    // Update KV + alias map
    await writeCategoryRename(oldName, trimmedNew)

    // Try to update post frontmatter (works locally; silent on Vercel read-only FS)
    try {
      const posts = getAllPosts(true)
      for (const post of posts) {
        if (post.category === oldName) {
          updatePost(post.slug, { ...post, category: trimmedNew })
        }
      }
    } catch {}

    revalidatePath("/", "layout")
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
