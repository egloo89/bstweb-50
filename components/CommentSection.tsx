"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Send, Loader2 } from "lucide-react"

interface Comment {
  id: string
  nickname: string
  content: string
  createdAt: string
}

function formatCommentDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return "방금 전"
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`
}

export function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/comments/${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => { if (data.ok) setComments(data.comments) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/comments/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, content }),
      })
      const data = await res.json()
      if (!data.ok) { setError(data.error); return }
      setComments(prev => [...prev, data.comment])
      setContent("")
    } catch {
      setError("댓글 등록에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-10 pt-6 border-t border-gray-100">
      {/* 헤더 */}
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-6">
        <MessageCircle className="h-5 w-5 text-[#4361ee]" />
        댓글 {comments.length}개
      </h2>

      {/* 댓글 목록 */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">첫 댓글을 남겨보세요!</p>
      ) : (
        <ul className="space-y-4 mb-8">
          {comments.map(c => (
            <li key={c.id} className="bg-gray-50 rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-800">{c.nickname}</span>
                <span className="text-xs text-gray-400">{formatCommentDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {/* 댓글 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">댓글 작성</h3>
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="닉네임"
          maxLength={20}
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#4361ee]/30 focus:border-[#4361ee]"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="댓글을 입력하세요..."
          maxLength={1000}
          required
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#4361ee]/30 focus:border-[#4361ee] resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{content.length}/1000</span>
          <button
            type="submit"
            disabled={submitting || !nickname.trim() || !content.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4361ee] text-white text-sm font-medium rounded-lg hover:bg-[#3451d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 등록 중...</>
              : <><Send className="h-3.5 w-3.5" /> 등록</>
            }
          </button>
        </div>
      </form>
    </section>
  )
}
