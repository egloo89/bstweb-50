import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface PostFrontmatter {
  title: string
  date: string
  category: string
  tags: string[]
  excerpt: string
  thumbnail?: string
  published: boolean
  views?: number
  scheduledAt?: string   // ISO string — 예약 발행 시각
}

export interface Post extends PostFrontmatter {
  slug: string
  content: string
}

export interface CreatePostInput {
  slug: string
  title: string
  date?: string
  category: string
  tags?: string[]
  excerpt?: string
  thumbnail?: string
  published?: boolean
  content: string
  views?: number
  scheduledAt?: string   // ISO string — 예약 발행 시각
}

const POSTS_DIR = path.join(process.cwd(), "posts")

// ── Redis key constants ────────────────────────────────────────────────────
const KV_SLUGS_KEY = "bstweb_post_slugs"    // string[] of Redis-managed slugs
const KV_DELETED_KEY = "bstweb_post_deleted" // string[] of MDX slugs marked deleted
const KV_POST = (slug: string) => `bstweb_post:${slug}`

// ── Redis helpers ──────────────────────────────────────────────────────────
async function getRedis() {
  try {
    const { Redis } = await import("@upstash/redis")
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    if (url && token) return new Redis({ url, token })
    return Redis.fromEnv()
  } catch (e) {
    console.error("[posts] getRedis failed:", e)
    return null
  }
}

async function kvGetSlugs(r: Awaited<ReturnType<typeof getRedis>>): Promise<string[]> {
  if (!r) return []
  try {
    const v = await r.get<string[]>(KV_SLUGS_KEY)
    return Array.isArray(v) ? v : []
  } catch { return [] }
}

async function kvGetDeleted(r: Awaited<ReturnType<typeof getRedis>>): Promise<Set<string>> {
  if (!r) return new Set()
  try {
    const v = await r.get<string[]>(KV_DELETED_KEY)
    return new Set(Array.isArray(v) ? v : [])
  } catch { return new Set() }
}

async function kvGetPost(r: Awaited<ReturnType<typeof getRedis>>, slug: string): Promise<Post | null> {
  if (!r) return null
  try {
    const result = await r.get<Post>(KV_POST(slug))
    if (!result) console.error(`[posts] kvGetPost: key "${KV_POST(slug)}" returned null`)
    return result
  } catch (e) {
    console.error(`[posts] kvGetPost error for slug "${slug}":`, e)
    return null
  }
}

// ── MDX helpers (read-only) ────────────────────────────────────────────────
function parseMdx(slug: string, raw: string): Post {
  const { data, content } = matter(raw)
  return {
    slug,
    content,
    title: data.title || "Untitled",
    date: data.date || new Date().toISOString(),
    category: data.category || "기타",
    tags: Array.isArray(data.tags) ? data.tags : [],
    excerpt: data.excerpt || "",
    thumbnail: data.thumbnail || "",
    published: data.published !== false,
    views: typeof data.views === "number" ? data.views : 0,
  }
}

function readMdxPost(slug: string): Post | null {
  try {
    const p = path.join(POSTS_DIR, `${slug}.mdx`)
    if (!fs.existsSync(p)) return null
    return parseMdx(slug, fs.readFileSync(p, "utf-8"))
  } catch { return null }
}

function getMdxSlugs(): string[] {
  try {
    return fs.readdirSync(POSTS_DIR)
      .filter(f => f.endsWith(".mdx") && !f.startsWith("_"))
      .map(f => f.replace(/\.mdx$/, ""))
  } catch { return [] }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getAllPosts(includeUnpublished = false): Promise<Post[]> {
  const r = await getRedis()
  const [kvSlugs, deleted] = await Promise.all([
    kvGetSlugs(r),
    kvGetDeleted(r),
  ])

  // Fetch Redis posts in parallel
  const kvPosts = (await Promise.all(kvSlugs.map(s => kvGetPost(r, s))))
    .filter((p): p is Post => p !== null)

  // MDX posts not overridden by Redis and not deleted
  const kvSlugSet = new Set(kvSlugs)
  const mdxPosts = getMdxSlugs()
    .filter(s => !kvSlugSet.has(s) && !deleted.has(s))
    .map(readMdxPost)
    .filter((p): p is Post => p !== null)

  const all = [...kvPosts, ...mdxPosts]

  // 예약 발행: scheduledAt 이 현재 시각 이전인 미발행 글을 자동 발행
  const now = new Date().toISOString()
  const toPublish = all.filter(p => !p.published && p.scheduledAt && p.scheduledAt <= now)
  if (toPublish.length > 0 && r) {
    // fire-and-forget (페이지 렌더 블로킹 없이 Redis 업데이트)
    void Promise.all(
      toPublish.map(p => {
        // date를 scheduledAt으로 갱신 → 발행 시각이 표시되도록
        const updated = { ...p, published: true, date: p.scheduledAt!, scheduledAt: undefined }
        return r.set(KV_POST(p.slug), updated)
      })
    ).catch(console.error)
    // 반환값에서도 즉시 반영
    toPublish.forEach(p => { p.published = true; p.date = p.scheduledAt!; delete p.scheduledAt })
  }

  const filtered = includeUnpublished ? all : all.filter(p => p.published)
  return filtered.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const r = await getRedis()
  // Try Redis first (includes newly created and updated posts)
  const kvPost = await kvGetPost(r, slug)
  if (kvPost) return kvPost
  // Check if it was deleted from MDX
  const deleted = await kvGetDeleted(r)
  if (deleted.has(slug)) return null
  // Fall back to MDX
  const mdx = readMdxPost(slug)
  if (mdx) return mdx
  // Last resort: scan slug list and try URL-decoded variant
  if (r) {
    const slugs = await kvGetSlugs(r)
    console.error(`[posts] getPostBySlug("${slug}") not found. Known slugs: ${JSON.stringify(slugs)}`)
    const decoded = decodeURIComponent(slug)
    if (decoded !== slug) {
      const fallback = await r.get<Post>(KV_POST(decoded))
      if (fallback) { console.error(`[posts] Found via decoded slug: "${decoded}"`); return fallback }
    }
  }
  return null
}

export async function incrementViews(slug: string): Promise<void> {
  try {
    const r = await getRedis()
    if (!r) return
    // Redis에 없는 경우(MDX 포스트 등)도 처리하기 위해 getPostBySlug 사용
    const post = await getPostBySlug(slug)
    if (!post) return
    const updated = { ...post, views: (post.views ?? 0) + 1 }
    await r.set(KV_POST(slug), updated)
    // MDX 포스트가 Redis slugs 목록에 없는 경우 추가
    const slugs = await kvGetSlugs(r)
    if (!slugs.includes(slug)) {
      await r.set(KV_SLUGS_KEY, [...slugs, slug])
    }
  } catch (e) {
    console.error("[posts] incrementViews error:", e)
  }
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const r = await getRedis()
  // Check duplicate slug
  const existing = await getPostBySlug(input.slug)
  if (existing) throw new Error("이미 존재하는 슬러그입니다.")

  const post: Post = {
    slug: input.slug,
    title: input.title,
    date: input.date || new Date().toISOString().split("T")[0],
    category: input.category,
    tags: input.tags || [],
    excerpt: input.excerpt || "",
    thumbnail: input.thumbnail || "",
    published: input.published !== false,
    content: input.content,
    views: input.views ?? 0,
    ...(input.scheduledAt ? { scheduledAt: input.scheduledAt } : {}),
  }

  if (r) {
    const slugs = await kvGetSlugs(r)
    await Promise.all([
      r.set(KV_POST(post.slug), post),
      r.set(KV_SLUGS_KEY, [...slugs, post.slug]),
    ])
  } else {
    throw new Error("저장소에 연결할 수 없습니다. (KV 환경변수 확인)")
  }

  if (post.published) {
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.blackbayblog.com"
    const { pingSearchEngines } = await import("./indexnow")
    pingSearchEngines([`${BASE_URL}/blog/${encodeURIComponent(post.slug)}`]).catch(() => {})
  }

  return post
}

export async function updatePost(slug: string, input: CreatePostInput): Promise<Post> {
  const r = await getRedis()
  const existing = await getPostBySlug(slug)
  if (!existing) throw new Error("게시글을 찾을 수 없습니다.")

  const post: Post = {
    slug: input.slug,
    title: input.title,
    date: input.date || existing.date,
    category: input.category,
    tags: input.tags || [],
    excerpt: input.excerpt || "",
    thumbnail: input.thumbnail || "",
    published: input.published !== false,
    content: input.content,
    views: existing.views ?? 0,
    ...(input.scheduledAt ? { scheduledAt: input.scheduledAt } : {}),
  }

  if (!r) throw new Error("저장소에 연결할 수 없습니다.")

  const slugs = await kvGetSlugs(r)
  const ops: Promise<unknown>[] = [r.set(KV_POST(post.slug), post)]

  if (!slugs.includes(post.slug)) {
    ops.push(r.set(KV_SLUGS_KEY, [...slugs, post.slug]))
  }
  // If slug changed, remove old
  if (slug !== post.slug) {
    const newSlugs = slugs.filter(s => s !== slug)
    if (!newSlugs.includes(post.slug)) newSlugs.push(post.slug)
    ops.push(r.set(KV_SLUGS_KEY, newSlugs))
    ops.push(r.del(KV_POST(slug)))
    // If it was an MDX post, mark old slug deleted
    if (readMdxPost(slug)) {
      const deleted = await kvGetDeleted(r)
      deleted.add(slug)
      ops.push(r.set(KV_DELETED_KEY, [...deleted]))
    }
  }
  // If original was MDX post, mark as replaced in Redis
  if (readMdxPost(slug) && slug === post.slug) {
    const deleted = await kvGetDeleted(r)
    // Don't add to deleted — Redis version already overrides it
    // Just ensure it's in slugs
    if (!slugs.includes(post.slug)) {
      ops.push(r.set(KV_SLUGS_KEY, [...slugs, post.slug]))
    }
  }

  await Promise.all(ops)
  return post
}

export async function deletePost(slug: string): Promise<boolean> {
  const r = await getRedis()
  if (!r) return false

  const [slugs, deleted] = await Promise.all([kvGetSlugs(r), kvGetDeleted(r)])
  const ops: Promise<unknown>[] = []

  // Remove from Redis posts
  if (slugs.includes(slug)) {
    ops.push(r.set(KV_SLUGS_KEY, slugs.filter(s => s !== slug)))
    ops.push(r.del(KV_POST(slug)))
  }

  // Mark MDX post as deleted if it exists on disk
  if (readMdxPost(slug) && !deleted.has(slug)) {
    deleted.add(slug)
    ops.push(r.set(KV_DELETED_KEY, [...deleted]))
  }

  if (ops.length === 0) return false
  await Promise.all(ops)
  return true
}

export async function getRelatedPosts(slug: string, category: string, limit = 3): Promise<Post[]> {
  return (await getAllPosts())
    .filter(p => p.slug !== slug && p.category === category)
    .slice(0, limit)
}

export async function getRecentPosts(limit = 5): Promise<Post[]> {
  return (await getAllPosts()).slice(0, limit)
}
