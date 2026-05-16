"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard } from "lucide-react"

export function BlogHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-[#4361ee] flex items-center justify-center">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <span className="text-[15px] font-bold text-gray-800 tracking-tight">BoostWeb Blog</span>
        </Link>

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#4361ee] transition-colors px-3 py-1.5 rounded border border-gray-200 hover:border-[#4361ee]/40"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          관리자
        </Link>
      </div>
    </header>
  )
}
