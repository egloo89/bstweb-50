import { NextResponse } from "next/server"
import { getAllPosts } from "@/lib/posts"
import { pingSearchEngines } from "@/lib/indexnow"
import { AUTH_COOKIE } from "@/lib/auth"
import { cookies } from "next/headers"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.blackbayblog.com"

export async function POST() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(AUTH_COOKIE)
  if (!cookie || cookie.value !== "authenticated") {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const posts = await getAllPosts()
  const published = posts.filter(p => p.published)
  const urls = published.map(p => `${BASE_URL}/blog/${encodeURIComponent(p.slug)}`)

  // IndexNow는 한 번에 최대 10,000개 지원 — 청크 필요 없음
  await pingSearchEngines(urls)

  return NextResponse.json({ ok: true, count: urls.length })
}
