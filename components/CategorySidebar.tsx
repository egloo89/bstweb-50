"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Folder, Star, Flame } from "lucide-react"

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
  const isPopular = pathname === "/popular"

  return (
    <aside className="w-[220px] md:w-[240px] shrink-0 border-r border-gray-100 bg-[#f8f9fc] min-h-full">
      <div className="py-4">
        {/* 전체글보기 */}
        <Link
          href="/blog"
          className={`flex items-center justify-between px-5 py-2.5 text-[13px] md:text-sm transition-colors ${
            isAll ? "bg-[#4361ee]/10 text-[#4361ee] font-semibold" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 shrink-0" />
            전체글보기
          </span>
          <span className="text-xs text-gray-400 font-normal">{totalCount}</span>
        </Link>

        {/* 인기글 */}
        <Link
          href="/popular"
          className={`flex items-center gap-2.5 px-5 py-2.5 text-[13px] md:text-sm transition-colors ${
            isPopular ? "bg-[#4361ee]/10 text-[#4361ee] font-semibold" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Flame className={`h-4 w-4 shrink-0 ${isPopular ? "text-[#4361ee]" : "text-orange-400"}`} />
          인기글
        </Link>

        {/* 구분선 */}
        <div className="mx-5 my-3 border-t border-gray-200" />

        {/* 카테고리 목록 */}
        {categories
          .map((cat) => {
            const isActive = selectedCategory === cat.name
            return (
              <Link
                key={cat.name}
                href={`/category/${cat.slug}`}
                className={`flex items-center justify-between px-5 py-2.5 text-[13px] md:text-sm transition-colors ${
                  isActive ? "bg-[#4361ee]/10 text-[#4361ee] font-semibold"
                  : cat.count === 0 ? "text-gray-400 hover:bg-gray-100"
                  : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Folder className={`h-4 w-4 shrink-0 ${isActive ? "text-[#4361ee]" : cat.count === 0 ? "text-gray-300" : "text-amber-500"}`} />
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
