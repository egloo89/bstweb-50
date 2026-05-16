import Link from "next/link"
import { cn } from "@/lib/utils"

interface CategoryBadgeProps {
  category: string
  className?: string
  asLink?: boolean
}

export function CategoryBadge({ category, className, asLink = true }: CategoryBadgeProps) {
  const cls = cn(
    "inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium tracking-tight hover:bg-primary/15 transition-colors",
    className,
  )
  if (!asLink) return <span className={cls}>{category}</span>
  return (
    <Link href={`/category/${encodeURIComponent(category)}`} className={cls}>
      {category}
    </Link>
  )
}
