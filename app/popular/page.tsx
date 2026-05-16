import { getAllPosts } from "@/lib/posts"
import { getCategories } from "@/lib/categories"
import { BlogHeader } from "@/components/BlogHeader"
import { CategorySidebar } from "@/components/CategorySidebar"
import { FeaturedPosts } from "@/components/FeaturedPosts"
import { PostTable } from "@/components/PostTable"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "인기글",
  description: "조회수가 높은 인기 글 모음입니다.",
}

export default function PopularPage() {
  const allPosts = getAllPosts()
  const categories = getCategories()

  const posts = [...allPosts]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 15)

  return (
    <div className="blog-container">
      <BlogHeader />
      <FeaturedPosts posts={posts} />
      <div className="flex" style={{ minHeight: 500 }}>
        <div className="hidden md:block">
          <CategorySidebar categories={categories} totalCount={allPosts.length} />
        </div>
        <PostTable
          posts={posts}
          allCount={posts.length}
          label="인기글"
        />
      </div>
    </div>
  )
}
