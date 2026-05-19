"use client"

import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard } from "lucide-react"

export function BlogHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-14 md:h-16 items-center justify-between px-5 md:px-7">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/blackbay-logo.svg" alt="Black Bay Blog" width={40} height={40} className="shrink-0 rounded-full" />
          <span className="flex flex-col leading-tight">
            <span className="text-base md:text-lg font-bold text-gray-900 tracking-tight">Black Bay Blog</span>
            <span className="text-[10px] md:text-xs text-gray-400 font-medium tracking-wide">블랙베이 블로그</span>
          </span>
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
