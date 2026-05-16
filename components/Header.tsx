"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Moon, Sun, Menu, X, BookOpen, LayoutDashboard } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const NAV = [
  { label: "홈", href: "/" },
  { label: "블로그", href: "/blog" },
  { label: "카테고리", href: "/#categories" },
]

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark")

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container-blog flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="text-lg">BoostWeb Blog</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md border bg-background hover:bg-accent text-sm font-medium transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            관리자
          </Link>
          <button
            type="button"
            aria-label="테마 변경"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-accent transition-colors"
          >
            {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="메뉴 열기"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className={cn("md:hidden border-t bg-background", open ? "block" : "hidden")}>
        <nav className="container-blog flex flex-col py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-2 text-sm font-medium hover:text-primary"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="py-2 text-sm font-medium text-primary hover:opacity-80 flex items-center gap-1.5"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4" />
            관리자
          </Link>
        </nav>
      </div>
    </header>
  )
}
