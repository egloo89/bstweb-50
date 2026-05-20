import { getAllPosts } from "@/lib/posts"
import { getCategories } from "@/lib/categories"
import { BlogHeader } from "@/components/BlogHeader"
import { SiteFooter } from "@/components/SiteFooter"

export const dynamic = "force-dynamic"
export const revalidate = 0
import { CategorySidebar } from "@/components/CategorySidebar"
import { FeaturedPosts } from "@/components/FeaturedPosts"
import { PostTable } from "@/components/PostTable"

const PAGE_SIZE = 15

export default async function HomePage({ searchParams }: { searchParams: { page?: string } }) {
  const allPosts = await getAllPosts()
  const categories = await getCategories(false, allPosts)
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1)
  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * PAGE_SIZE
  const posts = allPosts.slice(start, start + PAGE_SIZE)

  return (
    <div className="blog-container flex flex-col">
      <BlogHeader />
      <FeaturedPosts posts={allPosts} />
      <div className="flex flex-1" style={{ minHeight: 500 }}>
        <div className="hidden md:block">
          <CategorySidebar categories={categories} totalCount={allPosts.length} />
        </div>
        <PostTable
          posts={posts}
          allCount={allPosts.length}
          label="전체글보기"
          currentPage={current}
          totalPages={totalPages}
          basePath="/"
        />
      </div>
      <SiteFooter />
    </div>
  )
}
