import Link from "next/link"
import type { Post } from "@/lib/posts"

interface Props {
  posts: Post[]
  allCount: number
  label?: string
  currentPage?: number
  totalPages?: number
  basePath?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  AI: "bg-violet-100 text-violet-700",
  웹개발: "bg-blue-100 text-blue-700",
  프로그래밍: "bg-green-100 text-green-700",
  디자인: "bg-pink-100 text-pink-700",
  생산성: "bg-orange-100 text-orange-700",
  튜토리얼: "bg-teal-100 text-teal-700",
  공지사항: "bg-red-100 text-red-700",
  기타: "bg-gray-100 text-gray-600",
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
  }
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.`
}

export function PostTable({ posts, allCount, label = "전체글보기", currentPage = 1, totalPages = 1, basePath = "/blog" }: Props) {
  return (
    <div className="flex-1 min-w-0">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <Link href="/blog" className="text-xs text-gray-400 hover:text-[#4361ee] transition-colors">
          더보기 &rsaquo;
        </Link>
      </div>

      {/* Table */}
      {posts.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm text-gray-400">
          등록된 글이 없습니다.
        </div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {posts.map((post, i) => {
              const num = allCount - ((currentPage - 1) * posts.length) - i
              const colorClass = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["기타"]
              return (
                <tr
                  key={post.slug}
                  className="border-b border-gray-50 hover:bg-[#f5f7ff] transition-colors group"
                >
                  <td className="pl-5 pr-2 py-3 text-gray-400 text-xs w-8 shrink-0">{num}</td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${colorClass}`}>
                        {post.category}
                      </span>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-gray-800 hover:text-[#4361ee] font-medium truncate transition-colors"
                      >
                        {post.title}
                      </Link>
                    </div>
                    {post.excerpt && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate pl-[52px]">{post.excerpt}</p>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-gray-400 text-xs whitespace-nowrap w-20 text-right">
                    {formatDate(post.date)}
                  </td>
                  <td className="py-3 pr-5 text-gray-400 text-xs w-8 text-right">
                    {post.views ?? 0}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 py-5">
          {currentPage > 1 && (
            <Link
              href={`${basePath}?page=${currentPage - 1}`}
              className="px-3 py-1.5 text-xs rounded border border-gray-200 text-gray-500 hover:border-[#4361ee] hover:text-[#4361ee] transition-colors"
            >
              &lsaquo;
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`${basePath}?page=${p}`}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                p === currentPage
                  ? "bg-[#4361ee] text-white border-[#4361ee]"
                  : "border-gray-200 text-gray-500 hover:border-[#4361ee] hover:text-[#4361ee]"
              }`}
            >
              {p}
            </Link>
          ))}
          {currentPage < totalPages && (
            <Link
              href={`${basePath}?page=${currentPage + 1}`}
              className="px-3 py-1.5 text-xs rounded border border-gray-200 text-gray-500 hover:border-[#4361ee] hover:text-[#4361ee] transition-colors"
            >
              &rsaquo;
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
