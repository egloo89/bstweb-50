import Link from "next/link"
import { getCategories } from "@/lib/categories"
import { getRecentPosts } from "@/lib/posts"
import { AdSidebar } from "./AdSense"
import { Folder, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"

export function Sidebar() {
  const categories = getCategories()
  const recent = getRecentPosts(5)

  return (
    <aside className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <h3 className="flex items-center gap-2 font-semibold mb-3 text-sm">
          <Folder className="h-4 w-4 text-primary" /> 카테고리
        </h3>
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat.name}>
              <Link
                href={`/category/${encodeURIComponent(cat.name)}`}
                className="flex justify-between items-center py-1.5 px-2 rounded-md text-sm hover:bg-accent transition-colors"
              >
                <span>{cat.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{cat.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h3 className="flex items-center gap-2 font-semibold mb-3 text-sm">
          <Clock className="h-4 w-4 text-primary" /> 최근 글
        </h3>
        <ul className="space-y-3">
          {recent.length === 0 && (
            <li className="text-sm text-muted-foreground">아직 글이 없습니다.</li>
          )}
          {recent.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="block group">
                <p className="text-sm font-medium leading-snug group-hover:text-primary line-clamp-2">
                  {p.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(p.date)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-xl border bg-card p-3">
        <AdSidebar />
      </div>
    </aside>
  )
}
