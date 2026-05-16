import Link from "next/link"
import { getAllPosts } from "@/lib/posts"
import { getCategories } from "@/lib/categories"
import { formatDate } from "@/lib/utils"
import { FileText, FolderTree, Eye, PlusCircle, Pencil } from "lucide-react"
import { DeletePostButton } from "./DeletePostButton"

export const dynamic = "force-dynamic"

export default function AdminDashboard() {
  const posts = getAllPosts(true)
  const categories = getCategories()
  const published = posts.filter((p) => p.published).length
  const drafts = posts.length - published

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
          <p className="text-sm text-muted-foreground mt-1">블로그 글과 카테고리를 관리하세요.</p>
        </div>
        <Link
          href="/admin/new-post"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" /> 새 글 작성
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<FileText className="h-5 w-5" />} label="전체 게시글" value={posts.length} />
        <Stat icon={<Eye className="h-5 w-5" />} label="발행됨" value={published} />
        <Stat icon={<FolderTree className="h-5 w-5" />} label="카테고리" value={categories.filter((c) => c.count > 0).length} />
      </div>

      <section id="posts" className="rounded-xl border bg-card">
        <div className="p-5 border-b">
          <h2 className="font-semibold">게시글 목록</h2>
          <p className="text-xs text-muted-foreground mt-1">초안 포함 전체 {posts.length}개 / 발행 {published} / 초안 {drafts}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">제목</th>
                <th className="text-left px-4 py-2 font-medium">카테고리</th>
                <th className="text-left px-4 py-2 font-medium">날짜</th>
                <th className="text-left px-4 py-2 font-medium">상태</th>
                <th className="text-right px-4 py-2 font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground p-8">
                    아직 게시글이 없습니다.
                  </td>
                </tr>
              )}
              {posts.map((p) => (
                <tr key={p.slug} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <Link href={`/blog/${p.slug}`} className="font-medium hover:text-primary" target="_blank">
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.date)}</td>
                  <td className="px-4 py-3">
                    {p.published ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-xs">발행됨</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-600 px-2 py-0.5 text-xs">초안</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/edit/${p.slug}`}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        <Pencil className="h-3 w-3" /> 수정
                      </Link>
                      <DeletePostButton slug={p.slug} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}
