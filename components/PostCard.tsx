import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"
import { CategoryBadge } from "./CategoryBadge"
import { formatDate } from "@/lib/utils"
import type { Post } from "@/lib/posts"

const GRADIENTS = ["gradient-thumb", "gradient-thumb-2", "gradient-thumb-3", "gradient-thumb-4"]

function pickGradient(slug: string) {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/40">
      <Link href={`/blog/${post.slug}`} className="block">
        <div
          className={`relative h-44 w-full ${pickGradient(post.slug)} flex items-center justify-center`}
          style={
            post.thumbnail
              ? {
                  backgroundImage: `url(${post.thumbnail})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!post.thumbnail && (
            <span className="text-white/90 font-bold text-2xl tracking-tight px-4 text-center line-clamp-2">
              {post.title}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <CategoryBadge category={post.category} />
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(post.date)}
          </span>
        </div>
        <h3 className="mb-2 text-lg font-semibold leading-snug tracking-tight">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-primary transition-colors line-clamp-2"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mb-4 text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
        >
          더 읽기 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
