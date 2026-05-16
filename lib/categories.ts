import fs from "fs"
import path from "path"
import { getAllPosts } from "./posts"

export interface CategoryInfo {
  name: string
  count: number
  slug: string
}

interface CategoryData {
  list: string[]
  aliases: Record<string, string[]> // newName -> [oldNames...] (for Vercel where post files are read-only)
}

const POSTS_DIR = path.join(process.cwd(), "posts")
const CATEGORIES_FILE = path.join(POSTS_DIR, "_categories.json")
const TMP_FILE = "/tmp/_bstweb_cats.json"

// Module-level cache — survives across warm serverless invocations
let _mem: CategoryData | null = null

function readData(): CategoryData {
  if (_mem !== null) return _mem

  for (const file of [TMP_FILE, CATEGORIES_FILE]) {
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, "utf-8")
        const d = JSON.parse(raw)
        if (d && Array.isArray(d.list)) {
          _mem = d as CategoryData
          return _mem
        }
        // backward compat: old format was just an array
        if (Array.isArray(d)) {
          _mem = { list: d as string[], aliases: {} }
          return _mem
        }
      }
    } catch {}
  }

  _mem = { list: ["AI", "웹개발"], aliases: {} }
  return _mem
}

function writeData(data: CategoryData): void {
  _mem = data
  const json = JSON.stringify(data, null, 2)
  // Try /tmp first (writable on Vercel serverless)
  try { fs.writeFileSync(TMP_FILE, json, "utf-8") } catch {}
  // Try project directory (works locally / self-hosted)
  try {
    if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true })
    fs.writeFileSync(CATEGORIES_FILE, json, "utf-8")
  } catch {}
}

export function readCategoryList(): string[] {
  return readData().list
}

export function writeCategoryList(list: string[]): void {
  writeData({ ...readData(), list })
}

export function writeCategoryRename(oldName: string, newName: string): void {
  const data = readData()
  const newList = data.list.map((c) => (c === oldName ? newName : c))

  // Accumulate aliases: newName inherits oldName's aliases + oldName itself
  const prevAliases = data.aliases[oldName] ?? []
  const newAliases = { ...data.aliases }
  delete newAliases[oldName]
  newAliases[newName] = [oldName, ...prevAliases]

  writeData({ list: newList, aliases: newAliases })
}

export function getAliases(): Record<string, string[]> {
  return readData().aliases
}

export function getCategories(): CategoryInfo[] {
  const posts = getAllPosts()
  const { list, aliases } = readData()

  // Build reverse alias map: oldName -> currentName
  const reverseAlias = new Map<string, string>()
  for (const [current, olds] of Object.entries(aliases)) {
    for (const old of olds) reverseAlias.set(old, current)
  }

  const countMap = new Map<string, number>()
  list.forEach((n) => countMap.set(n, 0))

  posts.forEach((p) => {
    const cat = p.category
    // Direct match
    if (countMap.has(cat)) {
      countMap.set(cat, (countMap.get(cat) ?? 0) + 1)
      return
    }
    // Alias match (post still has old category name in frontmatter)
    const current = reverseAlias.get(cat)
    if (current && countMap.has(current)) {
      countMap.set(current, (countMap.get(current) ?? 0) + 1)
    }
  })

  return list.map((name) => ({
    name,
    count: countMap.get(name) ?? 0,
    slug: encodeURIComponent(name),
  }))
}

export function getPostsByCategory(category: string) {
  const { aliases } = readData()
  const aliasList = aliases[category] ?? []
  return getAllPosts().filter(
    (p) => p.category === category || aliasList.includes(p.category)
  )
}
