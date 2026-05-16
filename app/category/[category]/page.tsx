import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getPostsByCategory, getCategories } from "@/lib/categories"
import { PostCard } from "@/components/PostCard"
import { Sidebar } from "@/components/Sidebar"
import { AdBanner } from "@/components/AdSense"

export function generateStaticParams() {
  return getCategories().map((c) => ({ category: encodeURIComponent(c.name) }))
}

export function generateMetadata({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category)
  return { title: `${category} - 카테고리`, description: `${category} 카테고리의 모든 글` }
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category)
  const posts = getPostsByCategory(category)
  const categories = getCategories()
  const exists = categories.some((c) => c.name === category)
  if (!exists && posts.length === 0) notFound()

  return (
    <div className="container-blog py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> 홈으로
      </Link>

      <div className="mb-8">
        <p className="text-sm text-primary font-medium">카테고리</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">{category}</h1>
        <p className="text-muted-foreground mt-2">{posts.length}개의 글이 있습니다.</p>
      </div>

      <AdBanner />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px] mt-8">
        <div>
          {posts.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              이 카테고리에는 아직 글이 없습니다.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {posts.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  )
}
