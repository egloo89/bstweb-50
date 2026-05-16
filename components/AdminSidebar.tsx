"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import {
  Folder, Star, PlusCircle, LogOut, ExternalLink,
  Settings, Check, X, ChevronUp, ChevronDown, Trash2, FolderPlus, Pencil,
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
  const [newName, setNewName] = useState("")
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null)
  const [renameVal, setRenameVal] = useState("")
  const [saving, setSaving] = useState(false)
  const newInputRef = useRef<HTMLInputElement>(null)

  async function saveCategories(list: string[]) {
    setSaving(true)
    try {
      await fetch("/admin/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: list }),
      })
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

  function commitRename(i: number) {
    const name = renameVal.trim()
    if (!name || (name !== cats[i] && cats.includes(name))) {
      setRenamingIdx(null)
      return
    }
    const next = cats.map((c, idx) => (idx === i ? name : c))
    setCats(next)
    setRenamingIdx(null)
    saveCategories(next)
  }

  async function handleLogout() {
    await fetch("/admin/api/auth", { method: "DELETE" })
    router.push("/admin/login")
  }

  return (
    <aside className="w-[210px] md:w-[230px] shrink-0 border-r border-gray-100 bg-[#f8f9fc] flex flex-col">
      {/* 새 글 추가 */}
      <div className="p-3 border-b border-gray-100">
        <Link
          href="/admin/new-post"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#4361ee] text-white text-sm font-medium hover:bg-[#3451d1] transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          새 글 추가
        </Link>
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
  )
}
