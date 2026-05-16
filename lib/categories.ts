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
  aliases: Record<string, string[]> // currentName -> [oldNames]
}

const POSTS_DIR = path.join(process.cwd(), "posts")
const CATEGORIES_FILE = path.join(POSTS_DIR, "_categories.json")
const TMP_FILE = "/tmp/_bstweb_cats.json"
const KV_KEY = "bstweb_categories"

// Module-level memory cache
let _mem: CategoryData | null = null

// ── KV helpers (gracefully no-op when KV env vars are absent) ──────────────

async function kvGet(): Promise<CategoryData | null> {
  try {
    const { Redis } = await import("@upstash/redis")
    const redis = Redis.fromEnv()
    const data = await redis.get<CategoryData>(KV_KEY)
    if (data && Array.isArray(data.list)) return data
  } catch {}
  return null
}

async function kvSet(data: CategoryData): Promise<void> {
  try {
    const { Redis } = await import("@upstash/redis")
    const redis = Redis.fromEnv()
    await redis.set(KV_KEY, data)
  } catch {}
}

// ── File helpers ────────────────────────────────────────────────────────────

function fileGet(): CategoryData | null {
  for (const file of [TMP_FILE, CATEGORIES_FILE]) {
    try {
      if (fs.existsSync(file)) {
        const d = JSON.parse(fs.readFileSync(file, "utf-8"))
        if (d && Array.isArray(d.list)) return d as CategoryData
        if (Array.isArray(d)) return { list: d as string[], aliases: {} }
      }
    } catch {}
  }
  return null
}

function fileSet(data: CategoryData): void {
  const json = JSON.stringify(data, null, 2)
  try { fs.writeFileSync(TMP_FILE, json, "utf-8") } catch {}
  try {
    if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true })
    fs.writeFileSync(CATEGORIES_FILE, json, "utf-8")
  } catch {}
}

// ── Core read / write ───────────────────────────────────────────────────────

async function readData(): Promise<CategoryData> {
  if (_mem !== null) return _mem
  // 1. Try Vercel KV (persistent across all instances)
  const fromKV = await kvGet()
  if (fromKV) { _mem = fromKV; return _mem }
  // 2. Try /tmp or bundled file (local dev / same instance)
  const fromFile = fileGet()
  if (fromFile) { _mem = fromFile; return _mem }
  // 3. Built-in defaults
  _mem = { list: ["AI", "웹개발"], aliases: {} }
  return _mem
}

async function writeData(data: CategoryData): Promise<void> {
  _mem = data
  await kvSet(data)   // primary: Vercel KV
  fileSet(data)       // secondary: /tmp + project dir (local dev)
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function readCategoryList(): Promise<string[]> {
  return (await readData()).list
}

export async function writeCategoryList(list: string[]): Promise<void> {
  await writeData({ ...(await readData()), list })
}

export async function writeCategoryRename(oldName: string, newName: string): Promise<void> {
  const data = await readData()
  const newList = data.list.map((c) => (c === oldName ? newName : c))
  const prevAliases = data.aliases[oldName] ?? []
  const newAliases = { ...data.aliases }
  delete newAliases[oldName]
  newAliases[newName] = [oldName, ...prevAliases]
  await writeData({ list: newList, aliases: newAliases })
}

export async function getCategories(): Promise<CategoryInfo[]> {
  const posts = getAllPosts()
  const { list, aliases } = await readData()

  // reverse alias map: oldName -> currentName
  const reverseAlias = new Map<string, string>()
  for (const [current, olds] of Object.entries(aliases)) {
    for (const old of olds) reverseAlias.set(old, current)
  }

  const countMap = new Map<string, number>()
  list.forEach((n) => countMap.set(n, 0))
  posts.forEach((p) => {
    const cat = p.category
    if (countMap.has(cat)) {
      countMap.set(cat, (countMap.get(cat) ?? 0) + 1)
    } else {
      const current = reverseAlias.get(cat)
      if (current && countMap.has(current)) {
        countMap.set(current, (countMap.get(current) ?? 0) + 1)
      }
    }
  })

  return list.map((name) => ({
    name,
    count: countMap.get(name) ?? 0,
    slug: encodeURIComponent(name),
  }))
}

export async function getPostsByCategory(category: string) {
  const { aliases } = await readData()
  const aliasList = aliases[category] ?? []
  return getAllPosts().filter(
    (p) => p.category === category || aliasList.includes(p.category)
  )
}
