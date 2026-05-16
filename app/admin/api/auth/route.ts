import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyPassword, getAuthCookieOptions, AUTH_COOKIE } from "@/lib/auth"

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || ""

  // Support both JSON login and form-encoded logout
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData()
    const action = form.get("action")
    if (action === "logout") {
      cookies().delete(AUTH_COOKIE)
      return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 })
    }
  }

  let body: { password?: string } = {}
  try {
    body = await req.json()
  } catch {
    // ignore
  }

  if (!body.password || !verifyPassword(body.password)) {
    return NextResponse.json({ ok: false, error: "비밀번호가 올바르지 않습니다." }, { status: 401 })
  }

  const opts = getAuthCookieOptions()
  cookies().set(opts)
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  cookies().delete(AUTH_COOKIE)
  return NextResponse.json({ ok: true })
}
