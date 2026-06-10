import { BlogHeader } from "@/components/BlogHeader"
import { SiteFooter } from "@/components/SiteFooter"
import type { Metadata } from "next"
import { Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "문의하기 | Black Bay Blog",
  description: "Black Bay Blog에 문의사항이 있으시면 이메일로 연락해 주세요.",
}

export default function ContactPage() {
  return (
    <div className="blog-container">
      <BlogHeader />
      <main className="max-w-3xl mx-auto px-5 py-10 text-sm text-gray-700 leading-relaxed">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">문의하기</h1>

        <section className="mb-8">
          <p className="mb-4">
            블로그 관련 문의, 광고·협찬 제안, 콘텐츠 제보, 오류 신고 등 어떤 내용이든 편하게 연락해 주세요.
            최대한 빠르게 답변드리겠습니다.
          </p>

          <div className="bg-[#f8f9fc] border border-gray-100 rounded-xl p-6 flex items-start gap-4">
            <div className="p-2 bg-[#4361ee]/10 rounded-lg">
              <Mail className="h-5 w-5 text-[#4361ee]" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-1">이메일 문의</p>
              <a
                href="mailto:pianosound4@gmail.com"
                className="text-[#4361ee] underline text-base font-medium"
              >
                pianosound4@gmail.com
              </a>
              <p className="text-xs text-gray-400 mt-1">평균 응답 시간: 1~2 영업일 이내</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">문의 가능한 내용</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>콘텐츠 오류 제보 및 수정 요청</li>
            <li>광고·협찬·제휴 제안</li>
            <li>블로그 개선 의견 및 피드백</li>
            <li>개인정보 관련 문의</li>
            <li>기타 문의사항</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
