const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bstweb-50.vercel.app"

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/admin/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
