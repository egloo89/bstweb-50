import { notFound } from "next/navigation"
import { getAllPosts } from "@/lib/posts"
import { getCategories, getPostsByCategory } from "@/lib/categories"
import { BlogHeader } from "@/components/BlogHeader"
import { CategorySidebar } from "@/components/CategorySidebar"

export const dynamic = "force-dynamic"
export const revalidate = 0
import { FeaturedPosts } from "@/components/FeaturedPosts"
import { PostTable } from "@/components/PostTable"

const PAGE_SIZE = 15

export function generateMetadata({ params }: { params: { category: string } }) {
  const name = decodeURIComponent(params.category)
  return { title: `${name} - 카테고리` }
}

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string }
  searchParams: { page?: string }
}) {
  const categoryName = decodeURIComponent(params.category)
  const allPosts = getAllPosts()
  const categories = getCategories()
  const catPosts = getPostsByCategory(categoryName)

  if (catPosts.length === 0 && !categories.find((c) => c.name === categoryName)) {
    notFound()
  }

  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1)
  const totalPages = Math.max(1, Math.ceil(catPosts.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * PAGE_SIZE
  const posts = catPosts.slice(start, start + PAGE_SIZE)

  return (
    <div className="blog-container">
      <BlogHeader />
      <FeaturedPosts posts={catPosts.length > 0 ? catPosts : allPosts} />
      <div className="flex" style={{ minHeight: 500 }}>
        <div className="hidden md:block">
          <CategorySidebar
            categories={categories}
            totalCount={allPosts.length}
            selectedCategory={categoryName}
          />
        </div>
        <PostTable
          posts={posts}
          allCount={catPosts.length}
          label={categoryName}
          currentPage={current}
          totalPages={totalPages}
          basePath={`/category/${params.category}`}
        />
      </div>
    </div>
  )
}
