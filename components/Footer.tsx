import Link from "next/link"
import { BookOpen, Github, Twitter, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="container-blog py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 font-bold mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="text-lg">BoostWeb Blog</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-md">
            AI와 웹 개발, 디자인에 관한 깊이 있는 인사이트를 공유합니다. 매주 새로운 글로 찾아뵙겠습니다.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">바로가기</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-primary">홈</Link></li>
            <li><Link href="/blog" className="hover:text-primary">블로그</Link></li>
            <li><Link href="/admin/login" className="hover:text-primary">관리자</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">팔로우</h4>
          <div className="flex gap-3 text-muted-foreground">
            <a href="#" aria-label="GitHub" className="hover:text-primary"><Github className="h-5 w-5" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-primary"><Twitter className="h-5 w-5" /></a>
            <a href="mailto:hello@example.com" aria-label="Email" className="hover:text-primary"><Mail className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container-blog py-4 text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} BoostWeb Blog. All rights reserved.</p>
          <p>Built with Next.js & Tailwind CSS</p>
        </div>
      </div>
    </footer>
  )
}
