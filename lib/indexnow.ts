const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.blackbayblog.com"
const INDEXNOW_KEY = "bstweb50indexnow2024"

const INDEXNOW_BODY = (urls: string[]) => JSON.stringify({
  host: new URL(BASE_URL).hostname,
  key: INDEXNOW_KEY,
  keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
  urlList: urls,
})

const HEADERS = { "Content-Type": "application/json; charset=utf-8" }

export async function pingSearchEngines(urls: string[]) {
  if (!urls.length) return

  const body = INDEXNOW_BODY(urls)
  const results: string[] = []

  // IndexNow — Bing, Yandex 등
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST", headers: HEADERS, body,
    })
    results.push(`IndexNow: ${res.status}`)
  } catch (e) {
    results.push(`IndexNow error: ${(e as Error).message}`)
  }

  // 네이버 SearchAdvisor IndexNow
  try {
    const res = await fetch("https://searchadvisor.naver.com/indexnow", {
      method: "POST", headers: HEADERS, body,
    })
    results.push(`Naver: ${res.status}`)
  } catch (e) {
    results.push(`Naver error: ${(e as Error).message}`)
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
