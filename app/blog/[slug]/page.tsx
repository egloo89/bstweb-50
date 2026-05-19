import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, Tag, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { getAllPosts, getPostBySlug } from "@/lib/posts"
import { getCategories } from "@/lib/categories"
import { CategorySidebar } from "@/components/CategorySidebar"
import { BlogHeader } from "@/components/BlogHeader"
import { MDXContent } from "@/components/MDXContent"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post) return { title: "글을 찾을 수 없습니다" }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.date },
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.`
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

function HTMLContent({ html }: { html: string }) {
  return <div className="prose-content" dangerouslySetInnerHTML={{ __html: html }} />
}

function LegacyContent({ content }: { content: string }) {
  return <MDXContent source={content} />
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace" }}>
        <h1 style={{ color: "red" }}>게시글을 찾을 수 없습니다</h1>
        <p>slug (params): <code>{params.slug}</code></p>
        <p>encoded: <code>{encodeURIComponent(params.slug)}</code></p>
        <p>Please visit <a href="/admin/api/debug">/admin/api/debug</a> to check Redis state.</p>
      </div>
    )
  }
  if (!post.published) notFound()

  const allPosts = await getAllPosts()
  const categories = await getCategories()
  const idx = allPosts.findIndex(p => p.slug === post.slug)
  const prevPost = idx < allPosts.length - 1 ? allPosts[idx + 1] : null
  const nextPost = idx > 0 ? allPosts[idx - 1] : null

  const isHTML = post.content.trimStart().startsWith("<")
  const colorClass = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["기타"]

  return (
    <div className="blog-container">
      <BlogHeader />
      <div className="flex" style={{ minHeight: 600 }}>
        <div className="hidden md:block">
          <CategorySidebar categories={categories} totalCount={allPosts.length} selectedCategory={post.category} />
        </div>
        <main className="flex-1 min-w-0 px-4 md:px-8 py-5 md:py-7">
          <Link href="/blog" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#4361ee] mb-4 md:mb-5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> 목록으로
          </Link>

          <header className="pb-4 md:pb-5 border-b border-gray-100 mb-5 md:mb-6">
            <span className={`inline-block text-[11px] px-2 py-0.5 rounded font-medium mb-2.5 ${colorClass}`}>
              {post.category}
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">{post.title}</h1>
            {post.excerpt && <p className="text-sm text-gray-500 mb-3">{post.excerpt}</p>}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(post.date)}</span>
              <span>조회 {post.views ?? 0}</span>
              {post.tags.length > 0 && (
                <span className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="h-3.5 w-3.5" />
                  {post.tags.map(t => (
                    <span key={t} className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">#{t}</span>
                  ))}
                </span>
              )}
            </div>
          </header>

          {post.thumbnail && (
            <img src={post.thumbnail} alt={post.title} className="w-full rounded-lg mb-6 max-h-80 object-cover" />
          )}

          <article>
            {isHTML
              ? <HTMLContent html={post.content} />
              : <LegacyContent content={post.content} />
            }
          </article>

          {post.tags.length > 0 && (
            <div className="mt-8 pt-5 border-t border-gray-100 flex flex-wrap gap-2">
              {post.tags.map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">#{t}</span>
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-gray-100 pt-5 grid grid-cols-2 gap-3 text-sm">
            {prevPost ? (
              <Link href={`/blog/${prevPost.slug}`} className="flex items-center gap-2 text-gray-500 hover:text-[#4361ee] transition-colors">
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">{prevPost.title}</span>
              </Link>
            ) : <div />}
            {nextPost ? (
              <Link href={`/blog/${nextPost.slug}`} className="flex items-center gap-2 text-gray-500 hover:text-[#4361ee] transition-colors justify-end text-right">
                <span className="truncate">{nextPost.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : <div />}
          </div>
        </main>
      </div>
    </div>
  )
}
