import Link from "next/link"
import type { Post } from "@/lib/posts"

const GRADIENTS = [
  "from-violet-600 to-indigo-600",
  "from-purple-600 to-pink-600",
  "from-blue-600 to-cyan-500",
  "from-indigo-700 to-blue-500",
  "from-rose-500 to-orange-400",
  "from-teal-500 to-emerald-400",
]

interface Props {
  posts: Post[]
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
  }
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.`
}

export function FeaturedPosts({ posts }: Props) {
  const featured = posts.slice(0, 4)
  if (featured.length === 0) return null

  return (
    <div className="p-4 md:p-6 border-b border-gray-100">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {featured.map((post, i) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block rounded-xl overflow-hidden border border-gray-100 hover:border-[#4361ee]/30 hover:shadow-lg transition-all"
          >
            {post.thumbnail ? (
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-[120px] md:h-[150px] object-cover"
              />
            ) : (
              <div className={`w-full h-[120px] md:h-[150px] bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center p-4`}>
                <span className="text-white text-sm font-semibold text-center leading-snug line-clamp-3">
                  {post.title}
                </span>
              </div>
            )}
            <div className="px-3 py-2.5 bg-white">
              <p className="text-xs md:text-[13px] font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-[#4361ee] transition-colors">
                {post.title}
              </p>
              <p className="text-[11px] md:text-xs text-gray-400 mt-1">{formatDateShort(post.date)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
