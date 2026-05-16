import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface PostFrontmatter {
  title: string
  date: string
  category: string
  tags: string[]
  excerpt: string
  thumbnail?: string
  published: boolean
  views?: number
}

export interface Post extends PostFrontmatter {
  slug: string
  content: string
}

const POSTS_DIR = path.join(process.cwd(), "posts")

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }
}

export function getAllPosts(includeUnpublished = false): Post[] {
  ensurePostsDir()
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"))
  const posts: Post[] = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "")
    const fullPath = path.join(POSTS_DIR, file)
    const raw = fs.readFileSync(fullPath, "utf-8")
    const { data, content } = matter(raw)
    return {
      slug,
      content,
      title: data.title || "Untitled",
      date: data.date || new Date().toISOString(),
      category: data.category || "기타",
      tags: Array.isArray(data.tags) ? data.tags : [],
      excerpt: data.excerpt || "",
      thumbnail: data.thumbnail || "",
      published: data.published !== false,
      views: typeof data.views === "number" ? data.views : 0,
    }
  })
  const filtered = includeUnpublished ? posts : posts.filter((p) => p.published)
  return filtered.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPostBySlug(slug: string): Post | null {
  ensurePostsDir()
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(fullPath)) return null
  const raw = fs.readFileSync(fullPath, "utf-8")
  const { data, content } = matter(raw)
  return {
    slug,
    content,
    title: data.title || "Untitled",
    date: data.date || new Date().toISOString(),
    category: data.category || "기타",
    tags: Array.isArray(data.tags) ? data.tags : [],
    excerpt: data.excerpt || "",
    thumbnail: data.thumbnail || "",
    published: data.published !== false,
    views: typeof data.views === "number" ? data.views : 0,
  }
}

export interface CreatePostInput {
  slug: string
  title: string
  date?: string
  category: string
  tags?: string[]
  excerpt?: string
  thumbnail?: string
  published?: boolean
  content: string
  views?: number
}

function serializePost(input: CreatePostInput): string {
  const fm = {
    title: input.title,
    date: input.date || new Date().toISOString().split("T")[0],
    category: input.category,
    tags: input.tags || [],
    excerpt: input.excerpt || "",
    thumbnail: input.thumbnail || "",
    published: input.published !== false,
    views: input.views ?? 0,
  }
  return matter.stringify(input.content || "", fm)
}

export function createPost(input: CreatePostInput): Post {
  ensurePostsDir()
  const filePath = path.join(POSTS_DIR, `${input.slug}.mdx`)
  if (fs.existsSync(filePath)) {
    throw new Error("이미 존재하는 슬러그입니다.")
  }
  fs.writeFileSync(filePath, serializePost(input), "utf-8")
  return getPostBySlug(input.slug)!
}

export function updatePost(slug: string, input: CreatePostInput): Post {
  ensurePostsDir()
  const oldPath = path.join(POSTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(oldPath)) {
    throw new Error("게시글을 찾을 수 없습니다.")
  }
  const newPath = path.join(POSTS_DIR, `${input.slug}.mdx`)
  fs.writeFileSync(newPath, serializePost(input), "utf-8")
  if (slug !== input.slug && fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath)
  }
  return getPostBySlug(input.slug)!
}

export function deletePost(slug: string): boolean {
  ensurePostsDir()
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return false
  fs.unlinkSync(filePath)
  return true
}

export function getRelatedPosts(slug: string, category: string, limit = 3): Post[] {
  return getAllPosts()
    .filter((p) => p.slug !== slug && p.category === category)
    .slice(0, limit)
}

export function getRecentPosts(limit = 5): Post[] {
  return getAllPosts().slice(0, limit)
}
