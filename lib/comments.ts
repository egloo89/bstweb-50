export interface Comment {
  id: string
  nickname: string
  content: string
  createdAt: string
}

const KV_COMMENTS = (slug: string) => `bstweb_comments:${slug}`

async function getRedis() {
  try {
    const { Redis } = await import("@upstash/redis")
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    if (url && token) return new Redis({ url, token })
    return Redis.fromEnv()
  } catch {
    return null
  }
}

export async function getComments(slug: string): Promise<Comment[]> {
  const r = await getRedis()
  if (!r) return []
  try {
    const data = await r.get<Comment[]>(KV_COMMENTS(slug))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function addComment(
  slug: string,
  nickname: string,
  content: string
): Promise<Comment> {
  const r = await getRedis()
  if (!r) throw new Error("저장소에 연결할 수 없습니다.")

  const comment: Comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nickname: nickname.trim().slice(0, 20),
    content: content.trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  }

  const existing = await getComments(slug)
  await r.set(KV_COMMENTS(slug), [...existing, comment])
  return comment
}

export async function deleteComment(slug: string, commentId: string): Promise<void> {
  const r = await getRedis()
  if (!r) return
  const existing = await getComments(slug)
  await r.set(KV_COMMENTS(slug), existing.filter(c => c.id !== commentId))
}
