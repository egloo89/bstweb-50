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
  const pad = (n: number) => String(n).padStart(2, "0")
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isThisYear = d.getFullYear() === now.getFullYear()
  const hasTime = dateStr.includes("T") || dateStr.includes(" ")
  const timePart = hasTime ? ` ${pad(d.getHours())}:${pad(d.getMinutes())}` : ""

  if (isToday) {
    return `오늘 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  if (isThisYear) {
    return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${timePart}`
  }
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${timePart}`
}

export function PostTable({ posts, allCount, label = "전체글보기", currentPage = 1, totalPages = 1, basePath = "/blog" }: Props) {
  return (
    <div className="flex-1 min-w-0">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between px-5 md:px-7 py-3 md:py-4 border-b border-gray-100">
        <span className="text-sm md:text-base font-semibold text-gray-800">{label}</span>
        <Link href="/blog" className="text-xs md:text-sm text-gray-400 hover:text-[#4361ee] transition-colors">
          더보기 &rsaquo;
        </Link>
      </div>

      {/* 포스트 목록 */}
      {posts.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">
          등록된 글이 없습니다.
        </div>
      ) : (
        <table className="w-full">
          <tbody>
            {posts.map((post, i) => {
              const num = allCount - ((currentPage - 1) * posts.length) - i
              const colorClass = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["기타"]
              return (
                <tr
                  key={post.slug}
                  className="border-b border-gray-50 hover:bg-[#f5f7ff] transition-colors"
                >
                  {/* 번호 */}
                  <td className="hidden sm:table-cell pl-5 md:pl-7 pr-2 py-3 md:py-4 text-gray-400 text-xs md:text-sm w-8 shrink-0 align-middle">
                    {num}
                  </td>
                  {/* 제목 */}
                  <td className="pl-4 sm:pl-0 py-3 md:py-4 pr-3 align-middle max-w-0 w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 text-[10px] md:text-xs px-1.5 py-0.5 rounded font-medium ${colorClass}`}>
                        {post.category}
                      </span>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-[13px] md:text-sm text-gray-800 hover:text-[#4361ee] font-medium truncate transition-colors"
                      >
                        {post.title}
                      </Link>
                    </div>
                    {post.excerpt && (
                      <p className="hidden sm:block text-xs text-gray-400 mt-0.5 truncate pl-[calc(1.5rem+8px)]">
                        {post.excerpt}
                      </p>
                    )}
                  </td>
                  {/* 날짜 */}
                  <td className="py-3 md:py-4 pr-3 text-gray-400 text-xs whitespace-nowrap w-28 text-right align-middle">
                    {formatDate(post.date)}
                  </td>
                  {/* 조회수: 모바일에서 숨김 */}
                  <td className="hidden sm:table-cell py-3 md:py-4 pr-5 md:pr-7 text-gray-400 text-xs md:text-sm w-10 text-right align-middle">
                    {post.views ?? 0}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 py-6">
          {currentPage > 1 && (
            <Link href={`${basePath}?page=${currentPage - 1}`} className="px-3 py-2 text-xs md:text-sm rounded border border-gray-200 text-gray-500 hover:border-[#4361ee] hover:text-[#4361ee] transition-colors">
              &lsaquo;
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`${basePath}?page=${p}`}
              className={`px-3 py-2 text-xs md:text-sm rounded border transition-colors ${
                p === currentPage
                  ? "bg-[#4361ee] text-white border-[#4361ee]"
                  : "border-gray-200 text-gray-500 hover:border-[#4361ee] hover:text-[#4361ee]"
              }`}
            >
              {p}
            </Link>
          ))}
          {currentPage < totalPages && (
            <Link href={`${basePath}?page=${currentPage + 1}`} className="px-3 py-2 text-xs md:text-sm rounded border border-gray-200 text-gray-500 hover:border-[#4361ee] hover:text-[#4361ee] transition-colors">
              &rsaquo;
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
