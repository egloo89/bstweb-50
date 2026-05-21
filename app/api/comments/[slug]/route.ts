import { NextResponse } from "next/server"
import { getComments, addComment } from "@/lib/comments"

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const slug = decodeURIComponent(params.slug)
  const comments = await getComments(slug)
  return NextResponse.json({ ok: true, comments })
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const slug = decodeURIComponent(params.slug)
  try {
    const { nickname, content } = await req.json()
    if (!nickname?.trim() || nickname.trim().length < 1) {
      return NextResponse.json({ ok: false, error: "닉네임을 입력해주세요." }, { status: 400 })
    }
    if (!content?.trim() || content.trim().length < 2) {
      return NextResponse.json({ ok: false, error: "댓글을 2자 이상 입력해주세요." }, { status: 400 })
    }
    const comment = await addComment(slug, nickname, content)
    return NextResponse.json({ ok: true, comment })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
