"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  Folder, Star, PlusCircle, LogOut, ExternalLink,
  Settings, Check, X, ChevronUp, ChevronDown, Trash2, FolderPlus, Pencil,
  Sparkles, TrendingUp, Building2, Flame, Loader2, Search, Pause, Play,
} from "lucide-react"
import { AutoPostModal } from "./AutoPostModal"

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

interface PlanInfo {
  id: string
  type: string
  label: string
  totalCount: number
  publishedCount: number
  nextAt: string
}

const POST_BUTTONS = [
  {
    type: "ai" as const,
    label: "AI 포스팅",
    icon: Sparkles,
    className: "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
  },
  {
    type: "finance" as const,
    label: "재테크 포스팅",
    icon: TrendingUp,
    className: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
  },
  {
    type: "loan" as const,
    label: "대출/국가제도",
    icon: Building2,
    className: "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700",
  },
  {
    type: "issue" as const,
    label: "이슈 포스팅",
    icon: Flame,
    className: "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700",
  },
]

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
  const [activeModal, setActiveModal] = useState<"ai" | "finance" | "loan" | "issue" | null>(null)
  const [autoResult, setAutoResult] = useState<string | null>(null)
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [indexing, setIndexing] = useState(false)
  const [indexResult, setIndexResult] = useState<string | null>(null)
  const [autoPaused, setAutoPaused] = useState(false)
  const newInputRef = useRef<HTMLInputElement>(null)

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/admin/api/auto-post/jobs")
      const data = await res.json()
      if (data.ok && Array.isArray(data.plans)) {
        setPlans(data.plans)
        setAutoPaused(data.paused === true)
      }
    } catch {}
  }, [])

  async function togglePause() {
    const next = !autoPaused
    setAutoPaused(next)
    try {
      await fetch("/admin/api/auto-post/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: next }),
      })
    } catch {
      setAutoPaused(!next)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  async function cancelPlan(id: string) {
    try {
      await fetch(`/admin/api/auto-post/jobs?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      setPlans(prev => prev.filter(p => p.id !== id))
    } catch {}
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

  async function handleIndexAll() {
    if (indexing) return
    setIndexing(true)
    setIndexResult(null)
    try {
      const res = await fetch("/admin/api/index-all", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        setIndexResult(`✅ ${data.count}개 글 색인 요청 완료`)
      } else {
        setIndexResult("❌ 색인 요청 실패")
      }
    } catch {
      setIndexResult("❌ 오류 발생")
    } finally {
      setIndexing(false)
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

        {/* 2x2 포스팅 버튼 그리드 */}
        <div className="grid grid-cols-2 gap-1.5">
          {POST_BUTTONS.map(btn => {
            const Icon = btn.icon
            const isActive = activeModal === btn.type
            return (
              <button
                key={btn.type}
                onClick={() => setActiveModal(isActive ? null : btn.type)}
                className={`flex items-center justify-center gap-1 py-2 rounded-lg text-white text-[11px] font-medium transition-all ${btn.className} ${isActive ? "ring-2 ring-offset-1 ring-white/50" : ""}`}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{btn.label}</span>
              </button>
            )
          })}
        </div>

        {/* 활성화된 모달 */}
        {activeModal && (
          <AutoPostModal
            type={activeModal}
            label={POST_BUTTONS.find(b => b.type === activeModal)?.label ?? ""}
            onClose={() => setActiveModal(null)}
            onSuccess={(msg) => {
              setAutoResult(msg)
              setActiveModal(null)
              fetchPlans()
              router.refresh()
            }}
          />
        )}

        {autoResult && (
          <div className="text-[11px] leading-relaxed bg-gray-50 border border-gray-200 rounded-md px-2.5 py-2 text-gray-600 whitespace-pre-line">
            {autoResult}
            <button
              onClick={() => setAutoResult(null)}
              className="ml-1 text-gray-400 hover:text-gray-600"
            >
              <X className="inline h-3 w-3" />
            </button>
          </div>
        )}

        {/* 색인 요청 버튼 */}
        <button
          onClick={handleIndexAll}
          disabled={indexing}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-800 disabled:opacity-60 text-white text-[11px] font-medium transition-colors"
        >
          {indexing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          {indexing ? "색인 요청 중..." : "전체 글 색인 요청"}
        </button>
        {indexResult && (
          <div className="text-[11px] bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-600 flex items-center justify-between">
            <span>{indexResult}</span>
            <button onClick={() => setIndexResult(null)}><X className="h-3 w-3 text-gray-400" /></button>
          </div>
        )}

        {/* 자동포스팅 일시중지 토글 */}
        <button
          onClick={togglePause}
          className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-[11px] font-medium transition-colors ${
            autoPaused
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {autoPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          {autoPaused ? "자동포스팅 재개" : "자동포스팅 일시중지"}
        </button>
        {autoPaused && (
          <p className="text-[10px] text-amber-600 text-center">
            ⏸ 예약 발행이 멈춤 상태입니다 (심사 기간 권장)
          </p>
        )}

        {/* 예약 포스팅 현황 */}
        {plans.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">예약 포스팅 현황</p>
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between bg-blue-50 rounded-md px-2 py-1.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-blue-700 truncate">{plan.label}</p>
                  <p className="text-[10px] text-blue-500">
                    {plan.publishedCount}/{plan.totalCount}개 · 다음:{" "}
                    {new Date(plan.nextAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  onClick={() => cancelPlan(plan.id)}
                  className="p-1 text-blue-400 hover:text-red-500 transition-colors shrink-0"
                  title="예약 취소"
                >
                  <Loader2 className="hidden" />
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
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

    </>

  )
}
