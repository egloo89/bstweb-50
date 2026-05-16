"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Folder, Star, Flame, Bell } from "lucide-react"

interface CategoryInfo {
  name: string
  count: number
  slug: string
}

interface Props {
  categories: CategoryInfo[]
  totalCount: number
  selectedCategory?: string
}

export function CategorySidebar({ categories, totalCount, selectedCategory }: Props) {
  const pathname = usePathname()

  const isAll = !selectedCategory && (pathname === "/" || pathname === "/blog")

  return (
    <aside className="w-[200px] shrink-0 border-r border-gray-100 bg-[#f8f9fc] min-h-full">
      <div className="py-3">
        {/* 전체글보기 */}
        <Link
          href="/blog"
          className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
            isAll
              ? "bg-[#4361ee]/10 text-[#4361ee] font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
            전체글보기
          </span>
          <span className="text-xs text-gray-400 font-normal">{totalCount}</span>
        </Link>

        {/* 인기글 */}
        <Link
          href="/blog?sort=popular"
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            pathname === "/blog" && false
              ? "bg-[#4361ee]/10 text-[#4361ee] font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
          인기글
        </Link>

        {/* 공지사항 */}
        <Link
          href="/category/%EA%B3%B5%EC%A7%80%EC%82%AC%ED%95%AD"
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            selectedCategory === "공지사항"
              ? "bg-[#4361ee]/10 text-[#4361ee] font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Bell className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          공지사항
        </Link>

        {/* 구분선 */}
        <div className="mx-4 my-2 border-t border-gray-200" />

        {/* 카테고리 목록 */}
        {categories
          .filter((c) => c.name !== "공지사항" && c.count > 0)
          .map((cat) => {
            const isActive = selectedCategory === cat.name
            return (
              <Link
                key={cat.name}
                href={`/category/${cat.slug}`}
                className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
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
    </aside>
  )
}
