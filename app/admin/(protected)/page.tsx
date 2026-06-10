import { getAllPosts } from "@/lib/posts"
import { getCategories, getPostsByCategory } from "@/lib/categories"
import { BlogHeader } from "@/components/BlogHeader"
import { AdminSidebar } from "@/components/AdminSidebar"
import { AdminPostTable } from "@/components/AdminPostTable"

export const dynamic = "force-dynamic"

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const allPosts = await getAllPosts(true)
  const categories = await getCategories(true, allPosts)
  const selectedCategory = searchParams.category

  const posts = selectedCategory
    ? await getPostsByCategory(selectedCategory, true, allPosts)
    : allPosts

  return (
    <div className="blog-container">
      <BlogHeader />
      <div className="flex" style={{ minHeight: 600 }}>
        <AdminSidebar
          categories={categories}
          allCount={allPosts.length}
          selectedCategory={selectedCategory}
        />
        <AdminPostTable
          posts={posts}
          selectedCategory={selectedCategory}
        />
      </div>
    </div>
  )
}
