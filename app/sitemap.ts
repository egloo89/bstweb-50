import { getAllPosts } from "@/lib/posts"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bstweb-50.vercel.app"

export default async function sitemap() {
  const posts = await getAllPosts()

  const postUrls = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
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
    ...postUrls,
  ]
}
