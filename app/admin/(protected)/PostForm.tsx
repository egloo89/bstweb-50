"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Save, X, Upload, Loader2, Zap, Clock, EyeOff } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { slugify } from "@/lib/utils"

const RichEditor = dynamic(
  () => import("@/components/RichEditor").then(m => ({ default: m.RichEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ minHeight: 520 }}>
        에디터 로딩 중...
      </div>
    ),
  }
)

// lazy-load firebase to avoid SSR issues
let _storage: import("firebase/storage").FirebaseStorage | null = null
async function getStorage() {
  if (_storage) return _storage
  const { storage } = await import("@/lib/firebase")
  _storage = storage
  return storage
}
async function uploadToFirebase(file: File, path: string, onProgress: (p: number) => void): Promise<string> {
  const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage")
  const storage = await getStorage()
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), file)
    task.on("state_changed",
      snap => onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    )
  })
}

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
  scheduledAt?: string
}

type PublishMode = "immediate" | "scheduled" | "draft"

function getInitialPublishMode(initial?: Partial<PostFormValues>): PublishMode {
  if (initial?.scheduledAt) return "scheduled"
  if (initial?.published === false) return "draft"
  return "immediate"
}

function getDefaultScheduledAt(initial?: Partial<PostFormValues>): string {
  if (initial?.scheduledAt) return initial.scheduledAt.slice(0, 16)
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T09:00`
}

interface PostFormProps {
  initial?: Partial<PostFormValues>
  mode: "create" | "edit"
  originalSlug?: string
}

const EMPTY: PostFormValues = {
  slug: "",
  title: "",
  date: new Date().toISOString(),
  category: "",
  tags: "",
  excerpt: "",
  thumbnail: "",
  published: true,
  content: "",
}

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4361ee]/30 text-sm placeholder-gray-400"

export function PostForm({ initial, mode, originalSlug }: PostFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<PostFormValues>({ ...EMPTY, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const [categories, setCategories] = useState<string[]>([])
  const [htmlMode, setHtmlMode] = useState(false)
  const [publishMode, setPublishMode] = useState<PublishMode>(() => getInitialPublishMode(initial))
  const [scheduledDateTime, setScheduledDateTime] = useState(() => getDefaultScheduledAt(initial))

  // thumbnail upload
  const thumbFileRef = useRef<HTMLInputElement>(null)
  const [thumbUploading, setThumbUploading] = useState(false)
  const [thumbProgress, setThumbProgress] = useState(0)

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

  const uploadThumbnail = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return
    setThumbUploading(true)
    setThumbProgress(0)
    try {
      const path = `thumbnails/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
      const url = await uploadToFirebase(file, path, setThumbProgress)
      set("thumbnail", url)
    } catch {
      // silent
    } finally {
      setThumbUploading(false)
    }
  }, [])

  function onThumbFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadThumbnail(file)
    e.target.value = ""
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!values.title.trim() || !values.slug.trim()) {
      setError("제목은 필수입니다.")
      return
    }
    setLoading(true)
    const payload: Record<string, unknown> = {
      slug: values.slug.trim(),
      title: values.title.trim(),
      date: values.date,
      category: values.category || (categories[0] ?? "기타"),
      tags: values.tags.split(",").map(t => t.trim()).filter(Boolean),
      excerpt: values.excerpt,
      thumbnail: values.thumbnail,
      published: publishMode === "immediate",
      content: values.content,
    }
    if (publishMode === "scheduled" && scheduledDateTime) {
      payload.scheduledAt = new Date(scheduledDateTime).toISOString()
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
    <div className="min-h-screen bg-[#edf0f5]">
      <form onSubmit={onSubmit}>
        {/* ── Top bar ── */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <h1 className="text-base font-bold text-gray-800">
            {mode === "create" ? "글쓰기" : "글 수정"}
          </h1>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={loading}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60 transition-colors ${
                publishMode === "scheduled" ? "bg-blue-500 hover:bg-blue-600"
                : publishMode === "draft" ? "bg-amber-500 hover:bg-amber-600"
                : "bg-[#4361ee] hover:bg-[#3451d1]"
              }`}>
              {loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 저장 중...</>
                : publishMode === "scheduled"
                  ? <><Clock className="h-3.5 w-3.5" /> 예약 저장</>
                  : publishMode === "draft"
                    ? <><EyeOff className="h-3.5 w-3.5" /> 초안 저장</>
                    : <><Save className="h-3.5 w-3.5" /> 발행</>
              }
            </button>
            <Link href="/admin"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors">
              <X className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {error && (
            <div className="rounded-lg bg-red-50 text-red-600 px-4 py-3 text-sm border border-red-100">{error}</div>
          )}

          {/* 대표이미지 */}
          <div>
            <label className="block text-xs font-semibold text-[#4361ee] mb-1.5">대표이미지</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={values.thumbnail}
                onChange={e => set("thumbnail", e.target.value)}
                className={inputCls}
                placeholder="대표이미지 URL 또는 업로드로 자동 입력"
              />
              <input ref={thumbFileRef} type="file" accept="image/*" className="hidden" onChange={onThumbFileChange} />
              <button type="button"
                onClick={() => thumbFileRef.current?.click()}
                disabled={thumbUploading}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 transition-colors disabled:opacity-60">
                {thumbUploading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{thumbProgress}%</>
                  : <><Upload className="h-3.5 w-3.5" />업로드</>
                }
              </button>
            </div>
            {values.thumbnail && (
              <img src={values.thumbnail} alt="썸네일 미리보기"
                className="mt-2 h-32 w-full object-cover rounded-lg border border-gray-100" />
            )}
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-xs font-semibold text-[#4361ee] mb-1.5">제목 *</label>
            <input
              value={values.title}
              onChange={e => onTitleChange(e.target.value)}
              className={`${inputCls} text-base font-medium`}
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-xs font-semibold text-[#4361ee] mb-1.5">태그</label>
            <input
              value={values.tags}
              onChange={e => set("tags", e.target.value)}
              className={inputCls}
              placeholder="쉼표로 구분 (예: AI, 웹, 마케팅)"
            />
            <p className="mt-1 text-[11px] text-gray-400">검색 게시글 상세에 표시됩니다. 최대 20개, 태그당 40자.</p>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-xs font-semibold text-[#4361ee] mb-1.5">카테고리 *</label>
            <div className="relative">
              <select
                value={values.category}
                onChange={e => set("category", e.target.value)}
                className={`${inputCls} pr-8 appearance-none`}>
                {categories.length === 0
                  ? <option value="">불러오는 중...</option>
                  : categories.map(c => <option key={c} value={c}>{c}</option>)
                }
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
            </div>
          </div>

          {/* 발행 방식 */}
          <div>
            <label className="block text-xs font-semibold text-[#4361ee] mb-2">발행 방식</label>
            <div className="grid grid-cols-3 gap-2">
              {/* 즉시 발행 */}
              <button
                type="button"
                onClick={() => setPublishMode("immediate")}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                  publishMode === "immediate"
                    ? "border-[#4361ee] bg-[#4361ee]/5 text-[#4361ee]"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Zap className={`h-4 w-4 ${publishMode === "immediate" ? "text-[#4361ee]" : "text-gray-400"}`} />
                <span className="text-xs font-medium">즉시 발행</span>
              </button>
              {/* 예약 발행 */}
              <button
                type="button"
                onClick={() => setPublishMode("scheduled")}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                  publishMode === "scheduled"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Clock className={`h-4 w-4 ${publishMode === "scheduled" ? "text-blue-500" : "text-gray-400"}`} />
                <span className="text-xs font-medium">예약 발행</span>
              </button>
              {/* 비밀글 */}
              <button
                type="button"
                onClick={() => setPublishMode("draft")}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                  publishMode === "draft"
                    ? "border-amber-400 bg-amber-50 text-amber-600"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <EyeOff className={`h-4 w-4 ${publishMode === "draft" ? "text-amber-500" : "text-gray-400"}`} />
                <span className="text-xs font-medium">비밀글</span>
              </button>
            </div>

            {/* 예약 발행 날짜·시간 선택 */}
            {publishMode === "scheduled" && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <label className="block text-xs font-medium text-blue-700 mb-1.5">발행 날짜·시간 선택</label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={e => setScheduledDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="mt-1.5 text-[11px] text-blue-500">
                  지정한 시각이 되면 자동으로 공개됩니다. 저장 후 관리자 패널에서 예약 상태를 확인할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {/* 내용 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[#4361ee]">내용</span>
                <span className="text-[11px] text-gray-400">이미지·표·링크 등. 이미지는 Storage에 자동 업로드됩니다.</span>
              </div>
              <button
                type="button"
                onClick={() => setHtmlMode(h => !h)}
                className={`shrink-0 text-[11px] px-2.5 py-1 rounded border transition-colors ${htmlMode
                  ? "bg-[#4361ee] text-white border-[#4361ee]"
                  : "text-gray-500 border-gray-200 hover:border-[#4361ee] hover:text-[#4361ee]"}`}>
                HTML 직접 입력
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {htmlMode ? (
                <textarea
                  value={values.content}
                  onChange={e => set("content", e.target.value)}
                  className="w-full p-4 text-sm font-mono text-gray-700 focus:outline-none resize-none"
                  style={{ minHeight: 520 }}
                  placeholder="HTML을 직접 입력하세요..."
                />
              ) : (
                <RichEditor
                  content={values.content}
                  onChange={html => set("content", html)}
                />
              )}

              {/* Bottom mode bar */}
              <div className="border-t border-gray-100 px-4 py-2 flex justify-end gap-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setHtmlMode(false)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${!htmlMode
                    ? "bg-[#4361ee] text-white"
                    : "text-gray-400 hover:text-gray-600"}`}>
                  WYSIWYG
                </button>
                <button
                  type="button"
                  onClick={() => setHtmlMode(true)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${htmlMode
                    ? "bg-[#4361ee] text-white"
                    : "text-gray-400 hover:text-gray-600"}`}>
                  Markdown
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
