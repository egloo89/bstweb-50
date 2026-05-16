import Link from "next/link"
import { LayoutDashboard, FileText, PlusCircle, LogOut, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr]">
      <aside className="border-r bg-muted/30 lg:min-h-screen p-4">
        <div className="mb-6 px-2">
          <p className="text-xs text-muted-foreground">관리자 콘솔</p>
          <Link href="/admin" className="text-lg font-bold hover:text-primary">
            BoostWeb Blog
          </Link>
        </div>
        <nav className="space-y-1 text-sm">
          <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent">
            <LayoutDashboard className="h-4 w-4" /> 대시보드
          </Link>
          <Link
            href="/admin/new-post"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          >
            <PlusCircle className="h-4 w-4" /> 새 글 작성
          </Link>
          <Link
            href="/admin#posts"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          >
            <FileText className="h-4 w-4" /> 게시글 관리
          </Link>
        </nav>
        <div className="mt-6 border-t pt-4 space-y-1 text-sm">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" /> 사이트 보기
          </Link>
          <form action="/admin/api/auth" method="post">
            <input type="hidden" name="action" value="logout" />
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-left text-destructive"
            >
              <LogOut className="h-4 w-4" /> 로그아웃
            </button>
          </form>
        </div>
      </aside>
      <div className="p-6 lg:p-10">{children}</div>
    </div>
  )
}
