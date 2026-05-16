import { notFound } from "next/navigation"
import { getAllPosts } from "@/lib/posts"
import { getCategories, getPostsByCategory } from "@/lib/categories"
import { BlogHeader } from "@/components/BlogHeader"
import { CategorySidebar } from "@/components/CategorySidebar"
import { FeaturedPosts } from "@/components/FeaturedPosts"
import { PostTable } from "@/components/PostTable"

const PAGE_SIZE = 15

export async function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }))
}

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
  const catPosts = allPosts.filter((p) => p.category === categoryName)

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
        <CategorySidebar
          categories={categories}
          totalCount={allPosts.length}
          selectedCategory={categoryName}
        />
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
