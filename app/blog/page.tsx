import { getAllPosts } from "@/lib/posts"
import { PostCard } from "@/components/PostCard"
import { Sidebar } from "@/components/Sidebar"
import { Pagination } from "@/components/Pagination"
import { AdBanner } from "@/components/AdSense"

const PAGE_SIZE = 6

export const metadata = {
  title: "블로그 - 전체 글",
  description: "BoostWeb Blog의 모든 글을 확인하세요.",
}

export default function BlogPage({ searchParams }: { searchParams: { page?: string } }) {
  const all = getAllPosts()
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1)
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * PAGE_SIZE
  const posts = all.slice(start, start + PAGE_SIZE)

  return (
    <div className="container-blog py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">블로그</h1>
        <p className="text-muted-foreground mt-1">총 {all.length}개의 글</p>
      </div>

      <AdBanner />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px] mt-8">
        <div>
          {posts.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              발행된 글이 없습니다.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {posts.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          )}
          <Pagination currentPage={current} totalPages={totalPages} basePath="/blog" />
        </div>
        <Sidebar />
      </div>
    </div>
  )
}
