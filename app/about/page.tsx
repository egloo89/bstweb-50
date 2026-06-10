import { BlogHeader } from "@/components/BlogHeader"
import { SiteFooter } from "@/components/SiteFooter"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "소개 | Black Bay Blog",
  description: "Black Bay Blog는 AI, 재테크 등 실생활에 바로 적용 가능한 정보를 제공하는 한국어 블로그입니다.",
}

export default function AboutPage() {
  return (
    <div className="blog-container">
      <BlogHeader />
      <main className="max-w-3xl mx-auto px-5 py-10 text-sm text-gray-700 leading-relaxed">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">블로그 소개</h1>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">Black Bay Blog란?</h2>
          <p>
            Black Bay Blog는 <strong>AI 기술</strong>과 <strong>재테크·금융</strong> 분야의 실용적인 정보를 제공하는 한국어 블로그입니다.
            복잡하고 어려운 내용을 누구나 쉽게 이해하고 바로 활용할 수 있도록 풀어서 전달하는 것을 목표로 합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">다루는 주제</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>AI 트렌드:</strong> ChatGPT, Gemini, Claude 등 최신 AI 도구 활용법, 생성형 AI, AI 에이전트, 업무 자동화 등
            </li>
            <li>
              <strong>재테크·금융:</strong> 주식·ETF 투자 전략, 절세 방법, 적금·예금, 부업 수익화, 가계부 관리 등
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">블로그 운영 방향</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>독자가 읽고 나서 <strong>즉시 실행</strong>할 수 있는 구체적인 정보 제공</li>
            <li>신뢰할 수 있는 <strong>정확한 정보</strong>만을 다룸</li>
            <li>광고성·낚시성 콘텐츠 지양, <strong>독자 중심</strong>의 콘텐츠 운영</li>
            <li>꾸준한 업데이트로 <strong>최신 트렌드</strong> 반영</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">문의하기</h2>
          <p>
            블로그 관련 문의, 제안, 피드백은 언제든지 환영합니다.
          </p>
          <p className="mt-2">
            📧 이메일:{" "}
            <a href="mailto:pianosound4@gmail.com" className="text-[#4361ee] underline">
              pianosound4@gmail.com
            </a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
