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

    await writeCategoryRename(oldName, trimmedNew)

    // Update category field on posts stored in Redis
    try {
      const posts = await getAllPosts(true)
      await Promise.all(
        posts
          .filter(p => p.category === oldName)
          .map(p => updatePost(p.slug, { ...p, category: trimmedNew }))
      )
    } catch {}

    revalidatePath("/", "layout")
    revalidatePath("/blog", "layout")
    revalidatePath("/admin", "layout")
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
