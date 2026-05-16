"use client"

import Link from "next/link"
import { LayoutDashboard } from "lucide-react"

export function BlogHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-14 md:h-16 items-center justify-between px-5 md:px-7">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#4361ee] flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="text-base md:text-lg font-bold text-gray-800 tracking-tight">BoostWeb Blog</span>
        </Link>

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-gray-500 hover:text-[#4361ee] transition-colors px-3 py-1.5 rounded-md border border-gray-200 hover:border-[#4361ee]/40"
        >
          <LayoutDashboard className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span className="hidden sm:inline">관리자</span>
        </Link>
      </div>
    </header>
  )
}
