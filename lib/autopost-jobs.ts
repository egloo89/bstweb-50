export interface AutoPostPlan {
  id: string
  type: "ai" | "finance" | "loan" | "issue"
  label: string
  totalCount: number
  publishedCount: number
  keywords: string[]  // for issue type
  intervalMs: number  // 4~6h in ms
  nextAt: string      // ISO timestamp for next post
  createdAt: string
}

const KV_PLANS_KEY = "bstweb_autopost_plans"
const KV_PAUSED_KEY = "bstweb_autopost_paused"

async function getRedis() {
  try {
    const { Redis } = await import("@upstash/redis")
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    if (url && token) return new Redis({ url, token })
    return Redis.fromEnv()
  } catch (e) {
    console.error("[autopost-jobs] getRedis failed:", e)
    return null
  }
}

export async function getPlans(): Promise<AutoPostPlan[]> {
  const r = await getRedis()
  if (!r) return []
  try {
    const v = await r.get<AutoPostPlan[]>(KV_PLANS_KEY)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export async function savePlans(plans: AutoPostPlan[]): Promise<void> {
  const r = await getRedis()
  if (!r) return
  try {
    await r.set(KV_PLANS_KEY, plans)
  } catch (e) {
    console.error("[autopost-jobs] savePlans failed:", e)
  }
}

export async function addPlan(plan: AutoPostPlan): Promise<void> {
  const plans = await getPlans()
  plans.push(plan)
  await savePlans(plans)
}

export async function updatePlan(id: string, updates: Partial<AutoPostPlan>): Promise<void> {
  const plans = await getPlans()
  const idx = plans.findIndex(p => p.id === id)
  if (idx === -1) return
  plans[idx] = { ...plans[idx], ...updates }
  await savePlans(plans)
}

export async function removePlan(id: string): Promise<void> {
  const plans = await getPlans()
  await savePlans(plans.filter(p => p.id !== id))
}

export async function isPaused(): Promise<boolean> {
  const r = await getRedis()
  if (!r) return false
  try {
    return (await r.get<boolean>(KV_PAUSED_KEY)) === true
  } catch {
    return false
  }
}

export async function setPaused(paused: boolean): Promise<void> {
  const r = await getRedis()
  if (!r) return
  try {
    await r.set(KV_PAUSED_KEY, paused)
  } catch (e) {
    console.error("[autopost-jobs] setPaused failed:", e)
  }
}
