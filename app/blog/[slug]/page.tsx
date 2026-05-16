import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, Tag } from "lucide-react"
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/posts"
import { CategoryBadge } from "@/components/CategoryBadge"
import { MDXContent } from "@/components/MDXContent"
import { PostCard } from "@/components/PostCard"
import { Sidebar } from "@/components/Sidebar"
import { AdInArticle, AdFooter } from "@/components/AdSense"
import { formatDate } from "@/lib/utils"

export async function generateStaticParams() {
  return getAllPosts(true).map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) return { title: "글을 찾을 수 없습니다" }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
    },
  }
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post || !post.published) notFound()
  const related = getRelatedPosts(post.slug, post.category, 3)

  // Split content roughly in half for in-article ad
  const paragraphs = post.content.split(/\n\n+/)
  const half = Math.floor(paragraphs.length / 2)
  const firstHalf = paragraphs.slice(0, half).join("\n\n")
  const secondHalf = paragraphs.slice(half).join("\n\n")

  return (
    <div className="container-blog py-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> 블로그로 돌아가기
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <article>
          <header className="mb-8 pb-6 border-b">
            <CategoryBadge category={post.category} />
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              {post.title}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {formatDate(post.date)}
              </span>
              {post.tags.length > 0 && (
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  <Tag className="h-4 w-4" />
                  {post.tags.map((t) => (
                    <span key={t} className="bg-muted px-2 py-0.5 rounded text-xs">
                      #{t}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </header>

          {post.thumbnail && (
            <img src={post.thumbnail} alt={post.title} className="w-full rounded-xl mb-8" />
          )}

          <MDXContent source={firstHalf} />

          <AdInArticle />

          {secondHalf && <MDXContent source={secondHalf} />}

          <div className="mt-12 pt-8 border-t">
            <AdFooter />
          </div>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-6">관련 글</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </section>
          )}
        </article>

        <Sidebar />
      </div>
    </div>
  )
}
