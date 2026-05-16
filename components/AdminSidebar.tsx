"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Folder, Star, PlusCircle, LogOut, ExternalLink } from "lucide-react"

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

export function AdminSidebar({ categories, allCount, selectedCategory }: Props) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/admin/api/auth", { method: "DELETE" })
    router.push("/admin/login")
  }

  return (
    <aside className="w-[200px] md:w-[220px] shrink-0 border-r border-gray-100 bg-[#f8f9fc] flex flex-col">
      {/* 새 글 추가 버튼 */}
      <div className="p-3 border-b border-gray-100">
        <Link
          href="/admin/new-post"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#4361ee] text-white text-sm font-medium hover:bg-[#3451d1] transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          새 글 추가
        </Link>
      </div>

      <div className="py-3 flex-1">
        {/* 전체글보기 */}
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

        <div className="mx-4 my-2 border-t border-gray-200" />

        {/* 카테고리 목록 */}
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.name
          return (
            <Link
              key={cat.name}
              href={`/admin?category=${encodeURIComponent(cat.name)}`}
              className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-[#4361ee]/10 text-[#4361ee] font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Folder className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#4361ee]" : "text-amber-500"}`} />
                <span className="truncate">{cat.name}</span>
              </span>
              <span className="text-xs text-gray-400 font-normal ml-1 shrink-0">{cat.count}</span>
            </Link>
          )
        })}
      </div>

      {/* 하단 메뉴 */}
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
