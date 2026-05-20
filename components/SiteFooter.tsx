import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-[#f8f9fc] mt-10">
      <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Black Bay Blog. All rights reserved.</p>
        <nav className="flex items-center gap-4">
          <Link href="/about" className="hover:text-[#4361ee] transition-colors">소개</Link>
          <Link href="/contact" className="hover:text-[#4361ee] transition-colors">문의하기</Link>
          <Link href="/privacy" className="hover:text-[#4361ee] transition-colors font-medium text-gray-500">개인정보처리방침</Link>
        </nav>
      </div>
    </footer>
  )
}
