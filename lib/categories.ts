import { getAllPosts } from "./posts"

export interface CategoryInfo {
  name: string
  count: number
  slug: string
}

export const DEFAULT_CATEGORIES = [
  "AI",
  "웹개발",
  "프로그래밍",
  "디자인",
  "생산성",
  "튜토리얼",
  "기타",
]

export function getCategories(): CategoryInfo[] {
  const posts = getAllPosts()
  const map = new Map<string, number>()
  DEFAULT_CATEGORIES.forEach((c) => map.set(c, 0))
  posts.forEach((p) => {
    map.set(p.category, (map.get(p.category) || 0) + 1)
  })
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count, slug: encodeURIComponent(name) }))
    .sort((a, b) => b.count - a.count)
}

export function getPostsByCategory(category: string) {
  return getAllPosts().filter((p) => p.category === category)
}
