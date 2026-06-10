"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import {
  Folder, Star, PlusCircle, LogOut, ExternalLink,
  Settings, Check, X, ChevronUp, ChevronDown, Trash2, FolderPlus, Pencil,
  Sparkles, Loader2, Clock, Zap,
} from "lucide-react"

interface CategoryInfo {
  name: string
  count: number
  slug: string
}

interface Props {
  categories: CategoryInfo[]
  allCount: number
  selectedCategory?: string
}

export function AdminSidebar({ categories: initialCategories, allCount, selectedCategory }: Props) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [cats, setCats] = useState<string[]>(initialCategories.map((c) => c.name))
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(initialCategories.map((c) => [c.name, c.count]))
  )

  useEffect(() => {
    if (!editMode) {
      setCats(initialCategories.map((c) => c.name))
      setCounts(Object.fromEntries(initialCategories.map((c) => [c.name, c.count])))
    }
  }, [initialCategories])
  const [newName, setNewName] = useState("")
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null)
  const [renameVal, setRenameVal] = useState("")
  const [saving, setSaving] = useState(false)
  const [autoPosting, setAutoPosting] = useState<"ai" | "finance" | null>(null)
  const [autoResult, setAutoResult] = useState<string | null>(null)
  // 발행 방식 선택 모달
  const [postModal, setPostModal] = useState<{ type: "ai" | "finance" } | null>(null)
  const [scheduledAt, setScheduledAt] = useState("")
  const newInputRef = useRef<HTMLInputElement>(null)

  // 현재 시각을 datetime-local 입력값 형식으로 반환
  function getNowLocal() {
    const d = new Date()
    d.setMinutes(d.getMinutes() + 10) // 기본값: 10분 후
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function openPostModal(type: "ai" | "finance") {
    setScheduledAt(getNowLocal())
    setAutoResult(null)
    setPostModal({ type })
  }

  async function handleAutoPost(type: "ai" | "finance", scheduled?: string) {
    setPostModal(null)
    setAutoPosting(type)
    setAutoResult(null)
    try {
      const body: Record<string, string> = { type }
      if (scheduled) body.scheduledAt = new Date(scheduled).toISOString()
      const res = await fetch("/admin/api/auto-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.ok && data.error) {
        setAutoResult(`❌ 오류: ${data.error}`)
      } else {
        const ok = data.results?.map((r: { title: string; category: string }) =>
          scheduled ? `🕐 [${r.category}] 예약 완료: ${r.title}` : `✅ [${r.category}] ${r.title}`
        ).join("\n") || ""
        const fail = data.errors?.map((e: { category: string; error: string }) => `❌ [${e.category}] ${e.error}`).join("\n") || ""
        setAutoResult([ok, fail].filter(Boolean).join("\n"))
        router.refresh()
      }
    } catch (e) {
      setAutoResult(`❌ 네트워크 오류: ${(e as Error).message}`)
    } finally {
      setAutoPosting(null)
    }
  }

  async function saveCategories(list: string[]) {
    setSaving(true)
    try {
      const res = await fetch("/admin/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: list }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        alert(`저장 실패: ${data.error || "알 수 없는 오류"}`)
        return
      }
      // 카테고리 목록 최신화: counts도 새로 fetch
      const fresh = await fetch("/admin/api/categories").then(r => r.json())
      if (fresh.ok && Array.isArray(fresh.categories)) {
        setCats(fresh.categories)
      }
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function moveUp(i: number) {
    if (i === 0) return
    const next = [...cats]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    setCats(next)
    saveCategories(next)
  }

  function moveDown(i: number) {
    if (i === cats.length - 1) return
    const next = [...cats]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    setCats(next)
    saveCategories(next)
  }

  function deleteCategory(i: number) {
    const name = cats[i]
    if (!confirm(`"${name}" 폴더를 삭제하시겠습니까?\n(해당 카테고리의 글은 삭제되지 않습니다)`)) return
    const next = cats.filter((_, idx) => idx !== i)
    setCats(next)
    saveCategories(next)
  }

  function addCategory() {
    const name = newName.trim()
    if (!name || cats.includes(name)) { setNewName(""); return }
    const next = [...cats, name]
    setCats(next)
    setNewName("")
    saveCategories(next)
  }

  function startRename(i: number) {
    setRenamingIdx(i)
    setRenameVal(cats[i])
  }

  async function commitRename(i: number) {
    const newName = renameVal.trim()
    const oldName = cats[i]
    if (!newName || (newName !== oldName && cats.includes(newName))) {
      setRenamingIdx(null)
      return
    }
    if (newName === oldName) {
      setRenamingIdx(null)
      return
    }
    setRenamingIdx(null)
    setSaving(true)
    try {
      const res = await fetch("/admin/api/categories/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        alert(`저장 실패: ${data.error || "알 수 없는 오류"}`)
        return
      }
      setCats((prev) => prev.map((c, idx) => (idx === i ? newName : c)))
      setCounts((prev) => {
        const next = { ...prev }
        if (oldName !== newName) {
          next[newName] = prev[oldName] ?? 0
          delete next[oldName]
        }
        return next
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await fetch("/admin/api/auth", { method: "DELETE" })
    router.push("/admin/login")
  }

  return (
    <>
    <aside className="w-[210px] md:w-[230px] shrink-0 border-r border-gray-100 bg-[#f8f9fc] flex flex-col">
      {/* 새 글 추가 + 자동 포스팅 */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        <Link
          href="/admin/new-post"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#4361ee] text-white text-sm font-medium hover:bg-[#3451d1] transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          새 글 추가
        </Link>
        <div className="flex gap-1.5">
          <button
            onClick={() => openPostModal("ai")}
            disabled={autoPosting !== null}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {autoPosting === "ai" ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 작성 중...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> AI 포스팅</>
            )}
          </button>
          <button
            onClick={() => openPostModal("finance")}
            disabled={autoPosting !== null}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-medium hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {autoPosting === "finance" ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 작성 중...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> 재테크 포스팅</>
            )}
          </button>
        </div>
        {autoResult && (
          <div className="text-[11px] leading-relaxed bg-gray-50 border border-gray-200 rounded-md px-2.5 py-2 text-gray-600 whitespace-pre-line">
            {autoResult}
          </div>
        )}
      </div>

      <div className="py-3 flex-1 overflow-y-auto">
        {/* 전체글보기 */}
        {!editMode && (
          <Link
            href="/admin"
            className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
              !selectedCategory
                ? "bg-[#4361ee]/10 text-[#4361ee] font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
              전체글보기
            </span>
            <span className="text-xs text-gray-400 font-normal">{allCount}</span>
          </Link>
        )}

        {/* 구분 + 폴더 관리 버튼 */}
        <div className="flex items-center justify-between px-4 mt-2 mb-1">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">폴더</span>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors ${
              editMode
                ? "bg-[#4361ee] text-white"
                : "text-gray-400 hover:text-[#4361ee] hover:bg-[#4361ee]/10"
            }`}
          >
            {editMode ? <><Check className="h-3 w-3" /> 완료</> : <><Settings className="h-3 w-3" /> 관리</>}
          </button>
        </div>

        {/* 카테고리 목록 */}
        {cats.map((name, i) => {
          const count = counts[name] ?? 0
          const isActive = !editMode && selectedCategory === name

          return (
            <div
              key={name + i}
              className={`flex items-center transition-colors ${
                isActive ? "bg-[#4361ee]/10" : editMode ? "hover:bg-gray-100" : "hover:bg-gray-100"
              }`}
            >
              {editMode ? (
                /* 편집 모드 */
                <div className="flex items-center gap-1 w-full px-3 py-1.5">
                  {/* 위/아래 */}
                  <div className="flex flex-col">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20">
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === cats.length - 1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0 mx-1" />
                  {/* 이름 (클릭 시 편집) */}
                  {renamingIdx === i ? (
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onBlur={() => commitRename(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(i)
                        if (e.key === "Escape") setRenamingIdx(null)
                      }}
                      className="flex-1 text-xs border border-[#4361ee]/40 rounded px-1.5 py-0.5 outline-none bg-white min-w-0"
                    />
                  ) : (
                    <button
                      onClick={() => startRename(i)}
                      className="flex-1 text-left text-xs text-gray-700 truncate hover:text-[#4361ee] flex items-center gap-1 min-w-0"
                      title="클릭하여 이름 변경"
                    >
                      <span className="truncate">{name}</span>
                      <Pencil className="h-2.5 w-2.5 text-gray-300 shrink-0" />
                    </button>
                  )}
                  {/* 삭제 */}
                  <button
                    onClick={() => deleteCategory(i)}
                    className="p-0.5 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                /* 일반 모드 */
                <Link
                  href={`/admin?category=${encodeURIComponent(name)}`}
                  className={`flex items-center justify-between w-full px-4 py-2.5 text-sm ${
                    isActive ? "text-[#4361ee] font-semibold" : "text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Folder className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#4361ee]" : "text-amber-500"}`} />
                    <span className="truncate">{name}</span>
                  </span>
                  <span className="text-xs text-gray-400 font-normal ml-1 shrink-0">{count}</span>
                </Link>
              )}
            </div>
          )
        })}

        {/* 편집 모드: 새 폴더 추가 */}
        {editMode && (
          <div className="flex items-center gap-1.5 px-3 py-2 mt-1 border-t border-gray-100">
            <FolderPlus className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              ref={newInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCategory() }}
              placeholder="새 폴더 이름..."
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#4361ee]/50 bg-white min-w-0"
            />
            <button
              onClick={addCategory}
              className="shrink-0 text-[10px] px-2 py-1 rounded bg-[#4361ee] text-white hover:bg-[#3451d1] transition-colors disabled:opacity-50"
              disabled={!newName.trim()}
            >
              추가
            </button>
          </div>
        )}
      </div>

      {/* 하단 */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-[#4361ee] hover:bg-gray-100 rounded-md transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          사이트 보기
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          로그아웃
        </button>
      </div>
    </aside>

    {/* ── 발행 방식 선택 모달 ── */}
    {postModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles className={`h-4 w-4 ${postModal.type === "ai" ? "text-violet-500" : "text-emerald-500"}`} />
              <span className="font-semibold text-sm text-gray-800">
                {postModal.type === "ai" ? "AI 포스팅" : "재테크 포스팅"} 발행 방식
              </span>
            </div>
            <button
              onClick={() => setPostModal(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-3">
            {/* 즉시 발행 */}
            <button
              onClick={() => handleAutoPost(postModal.type)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-[#4361ee] bg-[#4361ee]/5 hover:bg-[#4361ee]/10 transition-colors group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#4361ee] text-white shrink-0">
                <Zap className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#4361ee]">즉시 발행</p>
                <p className="text-xs text-gray-500">AI가 작성 후 바로 게시됩니다</p>
              </div>
            </button>

            {/* 예약 발행 */}
            <div className="rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 text-white shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">예약 발행</p>
                  <p className="text-xs text-gray-500">지정한 날짜·시간에 자동 게시</p>
                </div>
              </div>
              <div className="px-4 pb-4 pt-3 space-y-3">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white"
                />
                <button
                  onClick={() => {
                    if (!scheduledAt) return
                    handleAutoPost(postModal.type, scheduledAt)
                  }}
                  disabled={!scheduledAt}
                  className="w-full py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  예약 설정하기
                </button>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center pt-1">
              AI 작성은 즉시 시작되며, 예약 시각에 자동으로 공개됩니다
            </p>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
