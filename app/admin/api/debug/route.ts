import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 })
  }
  try {
    const { Redis } = await import("@upstash/redis")
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    const envInfo = {
      hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      hasKvUrl: !!process.env.KV_REST_API_URL,
      hasKvToken: !!process.env.KV_REST_API_TOKEN,
    }
    if (!url || !token) {
      return NextResponse.json({ ok: false, error: "Redis env vars missing", envInfo })
    }
    const redis = new Redis({ url, token })
    const slugs = await redis.get<string[]>("bstweb_post_slugs")
    const deleted = await redis.get<string[]>("bstweb_post_deleted")
    const cats = await redis.get("bstweb_categories")
    return NextResponse.json({ ok: true, envInfo, slugs, deleted, cats })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
