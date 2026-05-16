import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { AUTH_COOKIE } from "@/lib/auth"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    !pathname.startsWith("/admin/api/auth")
  ) {
    const cookie = request.cookies.get(AUTH_COOKIE)
    if (!cookie || cookie.value !== "authenticated") {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
