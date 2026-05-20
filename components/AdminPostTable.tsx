"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Clock } from "lucide-react"
import type { Post } from "@/lib/posts"

interface Props {
  posts: Post[]
  selectedCategory?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  AI: "bg-violet-100 text-violet-700",
  웹개발: "bg-blue-100 text-blue-700",
  프로그래밍: "bg-green-100 text-green-700",
  디자인: "bg-pink-100 text-pink-700",
  생산성: "bg-orange-100 text-orange-700",
  튜토리얼: "bg-teal-100 text-teal-700",
  공지사항: "bg-red-100 text-red-700",
  기타: "bg-gray-100 text-gray-600",
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const pad = (n: number) => String(n).padStart(2, "0")
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const hasTime = dateStr.includes("T") || dateStr.includes(" ")
  const timePart = hasTime ? ` ${pad(d.getHours())}:${pad(d.getMinutes())}` : ""
  if (isToday) return `오늘 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${timePart}`
}

function formatScheduled(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function AdminPostTable({ posts, selectedCategory }: Props) {
  const router = useRouter()
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)

  const label = selectedCategory ? selectedCategory : "전체글보기"

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`"${title}" 을(를) 삭제하시겠습니까?`)) return
    setLoadingSlug(slug)
    try {
      const res = await fetch(`/admin/api/posts/${encodeURIComponent(slug)}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      alert("삭제 실패")
    } finally {
      setLoadingSlug(null)
    }
  }

  async function handleMove(slug: string, direction: "up" | "down") {
    setLoadingSlug(slug + direction)
    try {
      const res = await fetch(`/admin/api/posts/${encodeURIComponent(slug)}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      alert("순서 변경 실패")
    } finally {
      setLoadingSlug(null)
    }
  }

  return (
    <div className="flex-1 min-w-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">
          {label}
          <span className="ml-2 text-xs text-gray-400 font-normal">{posts.length}개</span>
        </span>
        <Link
          href={selectedCategory ? `/admin/new-post?category=${encodeURIComponent(selectedCategory)}` : "/admin/new-post"}
          className="text-xs text-[#4361ee] hover:underline"
        >
          + 새 글 추가
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-sm text-gray-400 gap-3">
          <p>등록된 글이 없습니다.</p>
          <Link
            href={selectedCategory ? `/admin/new-post?category=${encodeURIComponent(selectedCategory)}` : "/admin/new-post"}
            className="px-4 py-2 rounded-lg bg-[#4361ee] text-white text-xs hover:bg-[#3451d1] transition-colors"
          >
            첫 글 작성하기
          </Link>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="pl-5 pr-2 py-2.5 text-left text-xs text-gray-400 font-medium w-6">#</th>
              <th className="py-2.5 pr-3 text-left text-xs text-gray-400 font-medium">제목</th>
              <th className="py-2.5 pr-3 text-xs text-gray-400 font-medium w-20 text-center hidden md:table-cell">상태</th>
              <th className="py-2.5 pr-3 text-xs text-gray-400 font-medium w-32 text-right hidden md:table-cell">날짜</th>
              <th className="py-2.5 pr-5 text-xs text-gray-400 font-medium w-36 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, i) => {
              const colorClass = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["기타"]
              const isLoading = loadingSlug === post.slug || loadingSlug === post.slug + "up" || loadingSlug === post.slug + "down"
              return (
                <tr
                  key={post.slug}
                  className={`border-b border-gray-50 transition-colors ${isLoading ? "opacity-50" : "hover:bg-[#f5f7ff]"}`}
                >
                  {/* 번호 */}
                  <td className="pl-5 pr-2 py-3 text-xs text-gray-400 align-middle">{posts.length - i}</td>

                  {/* 제목 */}
                  <td className="py-3 pr-3 align-middle max-w-0 w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${colorClass}`}>
                        {post.category}
                      </span>
                      <span className="text-[13px] text-gray-800 font-medium truncate">
                        {post.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 pl-[calc(1.5rem+8px)] truncate">
                      {post.excerpt}
                    </p>
                  </td>

                  {/* 상태 */}
                  <td className="py-3 pr-3 text-center align-middle hidden md:table-cell">
                    {post.published ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                        <Eye className="h-3 w-3" /> 발행
                      </span>
                    ) : post.scheduledAt ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium" title={formatScheduled(post.scheduledAt)}>
                        <Clock className="h-3 w-3" /> 예약
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                        <EyeOff className="h-3 w-3" /> 초안
                      </span>
                    )}
                  </td>

                  {/* 날짜 */}
                  <td className="py-3 pr-3 text-xs text-gray-400 text-right align-middle hidden md:table-cell">
                    {post.scheduledAt ? (
                      <span className="text-blue-400">{formatScheduled(post.scheduledAt)}</span>
                    ) : (
                      formatDate(post.date)
                    )}
                  </td>

                  {/* 관리 버튼 */}
                  <td className="py-3 pr-5 align-middle">
                    <div className="flex items-center justify-end gap-1">
                      {/* 위/아래 */}
                      <button
                        onClick={() => handleMove(post.slug, "up")}
                        disabled={i === 0 || !!loadingSlug}
                        className="p-1 rounded text-gray-400 hover:text-[#4361ee] hover:bg-[#4361ee]/10 disabled:opacity-30 transition-colors"
                        title="위로"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(post.slug, "down")}
                        disabled={i === posts.length - 1 || !!loadingSlug}
                        className="p-1 rounded text-gray-400 hover:text-[#4361ee] hover:bg-[#4361ee]/10 disabled:opacity-30 transition-colors"
                        title="아래로"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>

                      {/* 수정 */}
                      <Link
                        href={`/admin/edit/${post.slug}`}
                        className="p-1 rounded text-gray-400 hover:text-[#4361ee] hover:bg-[#4361ee]/10 transition-colors"
                        title="수정"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>

                      {/* 삭제 */}
                      <button
                        onClick={() => handleDelete(post.slug, post.title)}
                        disabled={!!loadingSlug}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
