import { getAllPosts } from "@/lib/posts"
import { getCategories } from "@/lib/categories"

export const dynamic = "force-dynamic"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://boostwebstudio.vercel.app"

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  let posts: Awaited<ReturnType<typeof getAllPosts>> = []
  let categories: Awaited<ReturnType<typeof getCategories>> = []

  try {
    ;[posts, categories] = await Promise.all([getAllPosts(), getCategories()])
  } catch {}

  const now = new Date().toISOString()

  const staticUrls = [
    { loc: BASE_URL, priority: "1.0", changefreq: "daily" },
    { loc: `${BASE_URL}/blog`, priority: "0.9", changefreq: "daily" },
  ]

  const categoryUrls = categories.map((cat) => ({
    loc: `${BASE_URL}/category/${encodeURIComponent(cat.slug)}`,
    priority: "0.7",
    changefreq: "daily",
    lastmod: now,
  }))

  const postUrls = posts.map((post) => ({
    loc: `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`,
    priority: "0.8",
    changefreq: "weekly",
    lastmod: new Date(post.date).toISOString(),
  }))

  const allUrls = [...staticUrls, ...categoryUrls, ...postUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
