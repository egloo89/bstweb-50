import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`)

  return (
    <nav className="flex items-center justify-center gap-1 mt-10" aria-label="페이지네이션">
      <Link
        href={href(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm hover:bg-accent transition-colors",
          currentPage === 1 && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors",
            p === currentPage
              ? "bg-primary text-primary-foreground border-primary"
              : "hover:bg-accent",
          )}
        >
          {p}
        </Link>
      ))}
      <Link
        href={href(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm hover:bg-accent transition-colors",
          currentPage === totalPages && "pointer-events-none opacity-40",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  )
}
