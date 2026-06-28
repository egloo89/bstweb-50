import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { getPlans, removePlan, isPaused, setPaused } from "@/lib/autopost-jobs"

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }

  const [plans, paused] = await Promise.all([getPlans(), isPaused()])
  return NextResponse.json({ ok: true, plans, paused })
}

export async function POST(req: Request) {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }

  const { paused } = await req.json()
  await setPaused(paused === true)
  return NextResponse.json({ ok: true, paused: paused === true })
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
