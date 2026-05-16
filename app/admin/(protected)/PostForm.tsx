"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { slugify } from "@/lib/utils"

const DEFAULT_CATEGORIES = [
  "AI",
  "웹개발",
  "프로그래밍",
  "디자인",
  "생산성",
  "튜토리얼",
  "기타",
]

export interface PostFormValues {
  slug: string
  title: string
  date: string
  category: string
  tags: string
  excerpt: string
  thumbnail: string
  published: boolean
  content: string
}

interface PostFormProps {
  initial?: Partial<PostFormValues>
  mode: "create" | "edit"
  originalSlug?: string
}

const EMPTY: PostFormValues = {
  slug: "",
  title: "",
  date: new Date().toISOString().split("T")[0],
  category: "AI",
  tags: "",
  excerpt: "",
  thumbnail: "",
  published: true,
  content: "",
}

export function PostForm({ initial, mode, originalSlug }: PostFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<PostFormValues>({ ...EMPTY, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(mode === "edit")

  function set<K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function onTitleChange(v: string) {
    set("title", v)
    if (!slugTouched) {
      set("slug", slugify(v) || "untitled")
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!values.title.trim() || !values.slug.trim()) {
      setError("제목과 슬러그는 필수입니다.")
      return
    }
    setLoading(true)
    const payload = {
      slug: values.slug.trim(),
      title: values.title.trim(),
      date: values.date,
      category: values.category,
      tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
      excerpt: values.excerpt,
      thumbnail: values.thumbnail,
      published: values.published,
      content: values.content,
    }
    try {
      const url =
        mode === "create"
          ? "/admin/api/posts"
          : `/admin/api/posts/${encodeURIComponent(originalSlug || values.slug)}`
      const method = mode === "create" ? "POST" : "PUT"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || "저장 실패")
        setLoading(false)
        return
      }
      router.push("/admin")
      router.refresh()
    } catch {
      setError("네트워크 오류")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> 대시보드
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-2">
            {mode === "create" ? "새 글 작성" : "글 수정"}
          </h1>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {loading ? "저장 중..." : "저장"}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive p-3 text-sm">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Field label="제목 *">
            <input
              value={values.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className={inputCls}
              placeholder="멋진 글 제목을 입력하세요"
              required
            />
          </Field>

          <Field label="슬러그 (URL) *">
            <input
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set("slug", slugify(e.target.value))
              }}
              className={inputCls + " font-mono"}
              placeholder="my-awesome-post"
              required
            />
          </Field>

          <Field label="요약 (excerpt)">
            <textarea
              value={values.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              className={inputCls + " min-h-[80px]"}
              placeholder="목록과 SNS에 표시될 짧은 설명"
            />
          </Field>

          <Field label="본문 (Markdown / MDX)">
            <textarea
              value={values.content}
              onChange={(e) => set("content", e.target.value)}
              className={inputCls + " min-h-[420px] font-mono text-sm"}
              placeholder={"# 제목\n\n본문을 마크다운으로 작성하세요..."}
            />
          </Field>
        </div>

        <div className="space-y-4">
          <Field label="발행 상태">
            <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={values.published}
                onChange={(e) => set("published", e.target.checked)}
              />
              <span className="text-sm">{values.published ? "발행됨" : "초안"}</span>
            </label>
          </Field>

          <Field label="날짜">
            <input
              type="date"
              value={values.date}
              onChange={(e) => set("date", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="카테고리">
            <select
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputCls}
            >
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="태그 (쉼표 구분)">
            <input
              value={values.tags}
              onChange={(e) => set("tags", e.target.value)}
              className={inputCls}
              placeholder="ai, nextjs, tutorial"
            />
          </Field>

          <Field label="썸네일 URL">
            <input
              value={values.thumbnail}
              onChange={(e) => set("thumbnail", e.target.value)}
              className={inputCls}
              placeholder="https://..."
            />
          </Field>
        </div>
      </div>
    </form>
  )
}

const inputCls =
  "w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1.5">{label}</span>
      {children}
    </label>
  )
}
