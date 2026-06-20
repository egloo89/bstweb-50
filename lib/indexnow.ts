const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://boostwebstudio.vercel.app"
const INDEXNOW_KEY = "bstweb50indexnow2024"

export async function pingSearchEngines(urls: string[]) {
  if (!urls.length) return

  const results: string[] = []

  // IndexNow — Bing, Yandex, Naver 등 지원
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(BASE_URL).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    })
    results.push(`IndexNow: ${res.status}`)
  } catch (e) {
    results.push(`IndexNow error: ${(e as Error).message}`)
  }

  // Google sitemap ping
  try {
    const res = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE_URL}/sitemap.xml`)}`,
      { method: "GET" }
    )
    results.push(`Google ping: ${res.status}`)
  } catch (e) {
    results.push(`Google ping error: ${(e as Error).message}`)
  }

  console.log("[indexnow]", results.join(", "), "| urls:", urls.length)
}
