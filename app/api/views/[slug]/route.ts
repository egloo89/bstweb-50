import { NextResponse } from "next/server"
import { incrementViews } from "@/lib/posts"

export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await incrementViews(decodeURIComponent(params.slug))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
