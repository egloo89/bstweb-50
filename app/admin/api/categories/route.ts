import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { readCategoryList, writeCategoryList } from "@/lib/categories"

export async function GET() {
  return NextResponse.json({ ok: true, categories: readCategoryList() })
}

export async function PUT(req: Request) {
  try {
    const { categories } = await req.json()
    if (!Array.isArray(categories)) {
      return NextResponse.json({ ok: false, error: "잘못된 형식" }, { status: 400 })
    }
    const list = categories.map((c: unknown) => String(c).trim()).filter(Boolean)
    writeCategoryList(list)
    revalidatePath("/", "layout")
    return NextResponse.json({ ok: true, categories: list })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
