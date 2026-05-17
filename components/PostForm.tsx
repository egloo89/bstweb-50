"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { slugify } from "@/lib/utils"
import { BlogHeader } from "@/components/BlogHeader"
import { RichEditor } from "@/components/RichEditor"

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
  category: "",
  tags: "",
  excerpt: "",
  thumbnail: "",
  published: true,
  content: "",
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#4361ee]/30 text-sm"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-600 block mb-1.5">{label}</span>
      {children}
    </label>
  )
}

export function PostForm({ initial, mode, originalSlug }: PostFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<PostFormValues>({ ...EMPTY, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetch("/admin/api/categories")
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.categories)) {
          setCategories(data.categories)
          if (!values.category && data.categories.length > 0) {
            setValues(v => ({ ...v, category: data.categories[0] }))
          }
        }
      })
      .catch(() => {})
  }, [])

  function set<K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) {
    setValues(v => ({ ...v, [key]: value }))
  }

  function onTitleChange(v: string) {
    set("title", v)
    if (!slugTouched) set("slug", slugify(v) || "untitled")
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
      category: values.category || (categories[0] ?? "기타"),
      tags: values.tags.split(",").map(t => t.trim()).filter(Boolean),
      excerpt: values.excerpt,
      thumbnail: values.thumbnail,
      published: values.published,
      content: values.content,
    }
    try {
      const url = mode === "create"
        ? "/admin/api/posts"
        : `/admin/api/posts/${encodeURIComponent(originalSlug || values.slug)}`
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
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
    <div className="blog-container">
      <BlogHeader />
      <div className="px-6 md:px-10 py-6">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#4361ee] mb-2">
              <ArrowLeft className="h-3.5 w-3.5" /> 목록으로
            </Link>
            <h1 className="text-xl font-bold text-gray-800">
              {mode === "create" ? "새 글 작성" : "글 수정"}
            </h1>
          </div>
          <button type="submit" form="post-form" disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4361ee] px-5 py-2 text-sm font-medium text-white hover:bg-[#3451d1] disabled:opacity-60 transition-colors">
            <Save className="h-4 w-4" />
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 text-red-600 p-3 text-sm border border-red-100">{error}</div>
        )}

        <form id="post-form" onSubmit={onSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">

            {/* 왼쪽: 본문 영역 */}
            <div className="space-y-4">
              <Field label="제목 *">
                <input value={values.title} onChange={e => onTitleChange(e.target.value)}
                  className={`${inputCls} text-base font-medium`} placeholder="글 제목을 입력하세요" required />
              </Field>

              <Field label="슬러그 (URL) *">
                <input value={values.slug}
                  onChange={e => { setSlugTouched(true); set("slug", slugify(e.target.value)) }}
                  className={`${inputCls} font-mono text-xs`} placeholder="my-post-url" required />
              </Field>

              <Field label="요약">
                <textarea value={values.excerpt} onChange={e => set("excerpt", e.target.value)}
                  className={`${inputCls} min-h-[64px] resize-none`}
                  placeholder="목록에 표시될 짧은 설명 (1~2줄)" />
              </Field>

              <div>
                <span className="text-xs font-semibold text-gray-600 block mb-1.5">본문</span>
                <RichEditor content={values.content} onChange={html => set("content", html)} />
              </div>
            </div>

            {/* 오른쪽: 설정 영역 */}
            <div className="space-y-4">
              {/* 발행 상태 토글 */}
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600 mb-3">발행 상태</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={values.published}
                      onChange={e => set("published", e.target.checked)} />
                    <div className={`w-10 h-5 rounded-full transition-colors ${values.published ? "bg-[#4361ee]" : "bg-gray-300"}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${values.published ? "translate-x-5" : ""}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {values.published ? "발행됨" : "초안"}
                  </span>
                </label>
              </div>

              <Field label="날짜">
                <input type="date" value={values.date} onChange={e => set("date", e.target.value)} className={inputCls} />
              </Field>

              <Field label="카테고리">
                <select value={values.category} onChange={e => set("category", e.target.value)} className={inputCls}>
                  {categories.length === 0
                    ? <option value="">불러오는 중...</option>
                    : categories.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </Field>

              <Field label="태그 (쉼표 구분)">
                <input value={values.tags} onChange={e => set("tags", e.target.value)}
                  className={inputCls} placeholder="ai, nextjs, 튜토리얼" />
              </Field>

              <Field label="썸네일 URL">
                <input value={values.thumbnail} onChange={e => set("thumbnail", e.target.value)}
                  className={inputCls} placeholder="https://..." />
                {values.thumbnail && (
                  <img src={values.thumbnail} alt="썸네일 미리보기"
                    className="mt-2 w-full h-28 object-cover rounded-md border" />
                )}
              </Field>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
