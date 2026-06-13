const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://boostwebstudio.vercel.app"

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/admin/api/"],
      },
      // 네이버 봇 명시적 허용
      {
        userAgent: "Yeti",
        allow: "/",
        disallow: ["/admin/", "/admin/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
