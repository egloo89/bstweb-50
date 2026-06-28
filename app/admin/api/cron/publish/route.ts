import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getPlans, updatePlan, removePlan, isPaused } from "@/lib/autopost-jobs"
import { createPost } from "@/lib/posts"
import { readCategoryList } from "@/lib/categories"
import { slugify } from "@/lib/utils"
import { pingSearchEngines } from "@/lib/indexnow"
import {
  generatePost,
  fetchImage,
  resolveCategory,
  POST_SPECS,
} from "@/app/admin/api/auto-post/route"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.blackbayblog.com"

export const maxDuration = 60

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  if (await isPaused()) {
    return NextResponse.json({ ok: true, paused: true, processed: 0 })
  }

  const now = Date.now()
  const plans = await getPlans()
  const categoryList = await readCategoryList()

  const duePlans = plans.filter(
    p => p.publishedCount < p.totalCount && new Date(p.nextAt).getTime() <= now
  )

  const published: Array<{ planId: string; title: string; slug: string }> = []
  const errors: Array<{ planId: string; error: string }> = []

  for (const plan of duePlans) {
    try {
      // Find matching spec for this plan type
      const baseSpec = POST_SPECS.find(s => s.topic === plan.type)
      if (!baseSpec) {
        errors.push({ planId: plan.id, error: `알 수 없는 타입: ${plan.type}` })
        continue
      }

      const spec = { ...baseSpec, category: resolveCategory(baseSpec.category, categoryList) }
      const generated = await generatePost(
        spec,
        plan.type === "issue" && plan.keywords.length > 0 ? plan.keywords : undefined
      )

      const imageSeed = `${spec.category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const thumbnail = await fetchImage(generated.imageKeywords || spec.topic, imageSeed)

      const today = new Date().toISOString()
      const slug =
        slugify(generated.title) ||
        `${spec.category.toLowerCase()}-${today}-${Math.random().toString(36).slice(2, 6)}`

      const post = await createPost({
        slug,
        title: generated.title,
        date: today,
        category: spec.category,
        tags: generated.tags,
        excerpt: generated.excerpt,
        thumbnail,
        published: true,
        content: generated.content,
      })

      published.push({ planId: plan.id, title: post.title, slug: post.slug })

      // Update or remove plan
      const newPublishedCount = plan.publishedCount + 1
      if (newPublishedCount >= plan.totalCount) {
        await removePlan(plan.id)
      } else {
        const nextAt = new Date(Date.now() + plan.intervalMs).toISOString()
        await updatePlan(plan.id, {
          publishedCount: newPublishedCount,
          nextAt,
        })
      }
    } catch (e) {
      errors.push({ planId: plan.id, error: (e as Error)?.message || "알 수 없는 오류" })
    }
  }

  if (published.length > 0) {
    revalidatePath("/", "layout")
    const urls = published.map(p => `${BASE_URL}/blog/${encodeURIComponent(p.slug)}`)
    pingSearchEngines(urls).catch(() => {})
  }

  return NextResponse.json({
    ok: true,
    processed: duePlans.length,
    published,
    errors,
  })
}
