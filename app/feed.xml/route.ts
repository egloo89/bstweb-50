import { getAllPosts } from "@/lib/posts"

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
  try {
    posts = await getAllPosts()
  } catch {}

  const items = posts
    .slice(0, 50)
    .map((post) => {
      const url = `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`
      const pubDate = new Date(post.date).toUTCString()
      const description = escapeXml(post.excerpt || post.title)
      const thumbnail = post.thumbnail
        ? `<enclosure url="${escapeXml(post.thumbnail)}" type="image/jpeg" />`
        : ""
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${pubDate}</pubDate>
      ${thumbnail}
    </item>`
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Black Bay Blog (블랙베이 블로그)</title>
    <link>${BASE_URL}</link>
    <description>AI, 웹개발, 디자인, 생산성에 대한 깊이 있는 한국어 기술 블로그.</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
