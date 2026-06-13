import { getAllPosts } from "@/lib/posts"
import { getCategories } from "@/lib/categories"

export const dynamic = "force-dynamic"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://boostwebstudio.vercel.app"

export default async function sitemap() {
  // 에러가 나도 기본 페이지는 반환
  let posts: Awaited<ReturnType<typeof getAllPosts>> = []
  let categories: Awaited<ReturnType<typeof getCategories>> = []

  try {
    ;[posts, categories] = await Promise.all([getAllPosts(), getCategories()])
  } catch {}

  const postUrls = posts.map((post) => ({
    url: `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const categoryUrls = categories.map((cat) => ({
    url: `${BASE_URL}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...categoryUrls,
    ...postUrls,
  ]
}
