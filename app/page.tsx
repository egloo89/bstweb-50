import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { getAllPosts } from "@/lib/posts"
import { getCategories } from "@/lib/categories"
import { PostCard } from "@/components/PostCard"
import { AdBanner } from "@/components/AdSense"

export default function HomePage() {
  const posts = getAllPosts().slice(0, 6)
  const categories = getCategories()

  return (
    <div className="container-blog py-10 lg:py-16">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> 새로운 글이 매주 업데이트됩니다
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
          AI와 웹의 모든 것을<br />
          <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            깊이 있게 다룹니다
          </span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          최신 AI 도구, 웹 개발 트렌드, 디자인 인사이트를 한국어로 전달합니다.
          개발자와 디자이너를 위한 실용적인 가이드를 만나보세요.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            모든 글 보기 <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#categories"
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-5 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            카테고리 탐색
          </Link>
        </div>
      </section>

      {/* Top banner ad */}
      <AdBanner />

      {/* Latest posts */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">최신 글</h2>
            <p className="text-sm text-muted-foreground mt-1">가장 최근에 발행된 게시글</p>
          </div>
          <Link href="/blog" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
            전체보기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">아직 발행된 글이 없습니다.</p>
            <Link href="/admin/login" className="mt-4 inline-block text-sm text-primary hover:underline">
              관리자로 로그인해서 글 작성하기 →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section id="categories" className="mt-16 scroll-mt-20">
        <h2 className="text-2xl font-bold tracking-tight mb-6">카테고리</h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/category/${encodeURIComponent(cat.name)}`}
              className="group rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="text-sm text-muted-foreground mb-1">{cat.count}개의 글</div>
              <div className="text-lg font-semibold group-hover:text-primary transition-colors">
                {cat.name}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
