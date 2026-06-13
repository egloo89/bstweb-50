import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { getPlans, removePlan } from "@/lib/autopost-jobs"

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }

  const plans = await getPlans()
  return NextResponse.json({ ok: true, plans })
}

export async function DELETE(req: Request) {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ ok: false, error: "id 파라미터가 필요합니다." }, { status: 400 })
  }

  await removePlan(id)
  return NextResponse.json({ ok: true })
}
