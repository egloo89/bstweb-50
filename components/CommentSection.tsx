"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, Loader2, CornerDownRight, ChevronDown, ChevronUp } from "lucide-react"

interface Comment {
  id: string
  nickname: string
  content: string
  createdAt: string
  parentId?: string
}

interface CommentWithReplies extends Comment {
  replies: Comment[]
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
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

function buildTree(comments: Comment[]): CommentWithReplies[] {
  const roots: CommentWithReplies[] = []
  const map = new Map<string, CommentWithReplies>()
  comments.forEach(c => map.set(c.id, { ...c, replies: [] }))
  map.forEach(c => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(c)
    } else if (!c.parentId) {
      roots.push(c)
    }
  })
  return roots
}

// ── 답글 입력 폼 ────────────────────────────────────────────────────────────
interface ReplyFormProps {
  slug: string
  parentId: string
  parentNickname: string
  onSuccess: (comment: Comment) => void
  onCancel: () => void
}

function ReplyForm({ slug, parentId, parentNickname, onSuccess, onCancel }: ReplyFormProps) {
  const [nickname, setNickname] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/comments/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, content, parentId }),
      })
      const data = await res.json()
      if (!data.ok) { setError(data.error); return }
      onSuccess(data.comment)
      setContent("")
      setNickname("")
    } catch {
      setError("답글 등록에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 ml-8 bg-blue-50/60 rounded-xl p-3 space-y-2 border border-blue-100">
      <p className="text-xs text-blue-500 font-medium">
        <CornerDownRight className="inline h-3 w-3 mr-0.5 -mt-0.5" />
        {parentNickname}님께 답글
      </p>
      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-1.5">{error}</p>
      )}
      <input
        type="text"
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        placeholder="닉네임"
        maxLength={20}
        required
        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#4361ee]/30 focus:border-[#4361ee]"
      />
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="답글을 입력하세요..."
        maxLength={1000}
        required
        rows={2}
        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#4361ee]/30 focus:border-[#4361ee] resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{content.length}/1000</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 bg-white transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || !nickname.trim() || !content.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#4361ee] text-white text-xs font-medium rounded-lg hover:bg-[#3451d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? <><Loader2 className="h-3 w-3 animate-spin" /> 등록 중</>
              : <><Send className="h-3 w-3" /> 등록</>
            }
          </button>
        </div>
      </div>
    </form>
  )
}

// ── 개별 댓글 아이템 ─────────────────────────────────────────────────────────
interface CommentItemProps {
  comment: CommentWithReplies
  slug: string
  onAddReply: (reply: Comment) => void
}

function CommentItem({ comment, slug, onAddReply }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const replyCount = comment.replies.length

  return (
    <li className="bg-gray-50 rounded-xl px-4 py-3.5">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-gray-800">{comment.nickname}</span>
        <span className="text-xs text-gray-400">{formatCommentDate(comment.createdAt)}</span>
      </div>
      {/* 댓글 본문 */}
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

      {/* 답글 버튼 */}
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => setShowReplyForm(v => !v)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#4361ee] transition-colors"
        >
          <CornerDownRight className="h-3 w-3" />
          답글
        </button>
        {replyCount > 0 && (
          <button
            onClick={() => setShowReplies(v => !v)}
            className="flex items-center gap-1 text-xs text-[#4361ee]/80 hover:text-[#4361ee] transition-colors"
          >
            {showReplies
              ? <><ChevronUp className="h-3 w-3" /> 답글 {replyCount}개 숨기기</>
              : <><ChevronDown className="h-3 w-3" /> 답글 {replyCount}개 보기</>
            }
          </button>
        )}
      </div>

      {/* 답글 입력 폼 */}
      {showReplyForm && (
        <ReplyForm
          slug={slug}
          parentId={comment.id}
          parentNickname={comment.nickname}
          onSuccess={(reply) => {
            onAddReply(reply)
            setShowReplyForm(false)
            setShowReplies(true)
          }}
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      {/* 대댓글 목록 */}
      {showReplies && replyCount > 0 && (
        <ul className="mt-3 space-y-2">
          {comment.replies.map(reply => (
            <li key={reply.id} className="ml-6 bg-white border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CornerDownRight className="h-3 w-3 text-[#4361ee]/50 shrink-0" />
                <span className="text-sm font-semibold text-gray-800">{reply.nickname}</span>
                <span className="ml-auto text-xs text-gray-400 shrink-0">{formatCommentDate(reply.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-[18px]">{reply.content}</p>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
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

  function handleAddReply(reply: Comment) {
    setComments(prev => [...prev, reply])
  }

  const tree = buildTree(comments)
  const totalCount = comments.length

  return (
    <section className="mt-10 pt-6 border-t border-gray-100">
      {/* 헤더 */}
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-6">
        <MessageCircle className="h-5 w-5 text-[#4361ee]" />
        댓글 {totalCount}개
      </h2>

      {/* 댓글 목록 */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        </div>
      ) : tree.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">첫 댓글을 남겨보세요!</p>
      ) : (
        <ul className="space-y-4 mb-8">
          {tree.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              slug={slug}
              onAddReply={handleAddReply}
            />
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
