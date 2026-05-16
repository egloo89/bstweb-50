import fs from "fs"
import path from "path"
import { getAllPosts } from "./posts"

export interface CategoryInfo {
  name: string
  count: number
  slug: string
}

const POSTS_DIR = path.join(process.cwd(), "posts")
const CATEGORIES_FILE = path.join(POSTS_DIR, "_categories.json")

export function readCategoryList(): string[] {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf-8"))
      if (Array.isArray(data)) return data as string[]
    }
  } catch {}
  return ["AI", "웹개발"]
}

export function writeCategoryList(list: string[]): void {
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true })
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(list, null, 2), "utf-8")
}

export function getCategories(): CategoryInfo[] {
  const posts = getAllPosts()
  const list = readCategoryList()

  // also show categories that exist in posts but aren't in the list
  const postCats = [...new Set(posts.map((p) => p.category))]
  const allNames = [...new Set([...list, ...postCats])]

  const countMap = new Map<string, number>()
  allNames.forEach((n) => countMap.set(n, 0))
  posts.forEach((p) => countMap.set(p.category, (countMap.get(p.category) ?? 0) + 1))

  return allNames.map((name) => ({
    name,
    count: countMap.get(name) ?? 0,
    slug: encodeURIComponent(name),
  }))
}

export function getPostsByCategory(category: string) {
  return getAllPosts().filter((p) => p.category === category)
}
