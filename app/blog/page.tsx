import { getAllPosts } from "@/lib/posts"
import { getCategories } from "@/lib/categories"
import { BlogHeader } from "@/components/BlogHeader"

export const dynamic = "force-dynamic"
export const revalidate = 0
import { CategorySidebar } from "@/components/CategorySidebar"
import { FeaturedPosts } from "@/components/FeaturedPosts"
import { PostTable } from "@/components/PostTable"

const PAGE_SIZE = 15

export const metadata = {
  title: "전체글보기",
  description: "Black Bay의 모든 글을 확인하세요.",
}

export default async function BlogPage({ searchParams }: { searchParams: { page?: string } }) {
  const allPosts = getAllPosts()
  const categories = await getCategories()
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1)
  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * PAGE_SIZE
  const posts = allPosts.slice(start, start + PAGE_SIZE)

  return (
    <div className="blog-container">
      <BlogHeader />
      <FeaturedPosts posts={allPosts} />
      <div className="flex" style={{ minHeight: 500 }}>
        <div className="hidden md:block">
          <CategorySidebar categories={categories} totalCount={allPosts.length} />
        </div>
        <PostTable
          posts={posts}
          allCount={allPosts.length}
          label="전체글보기"
          currentPage={current}
          totalPages={totalPages}
          basePath="/blog"
        />
      </div>
    </div>
  )
}
