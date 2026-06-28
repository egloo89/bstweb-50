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
          <h2 className="text-base font-bold text-gray-800 mb-3">운영자 소개</h2>
          <p>
            안녕하세요, Black Bay Blog를 운영하는 <strong>블랙베이</strong>입니다.
            AI 도구를 직접 사용하며 일과 일상에 적용해온 경험과, 재테크·금융 정보를 꾸준히 공부하고 실천해온 내용을
            바탕으로 글을 씁니다. 어렵게 느껴지는 주제도 직접 부딪혀 본 사람의 관점에서, 실제로 도움이 되는
            정보만 골라 전달하려고 합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">블로그 운영 방향</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>독자가 읽고 나서 <strong>즉시 실행</strong>할 수 있는 구체적인 정보 제공</li>
            <li>신뢰할 수 있는 <strong>정확한 정보</strong>만을 다룸</li>
            <li>광고성·낚시성 콘텐츠 지양, <strong>독자 중심</strong>의 콘텐츠 운영</li>
            <li>꾸준한 업데이트로 <strong>최신 트렌드</strong> 반영</li>
            <li>발행 후에도 정보가 바뀌면 <strong>지속적으로 수정·보완</strong></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">콘텐츠 이용 안내</h2>
          <p>
            본 블로그의 재테크·금융 관련 콘텐츠는 <strong>일반적인 정보 제공을 목적</strong>으로 하며,
            특정 금융상품의 투자 권유나 자문이 아닙니다. 투자·금융 결정에 대한 최종 책임은 독자 본인에게 있으며,
            중요한 결정 전에는 반드시 전문가와 상담하시기 바랍니다. 모든 콘텐츠는 작성 시점의 정보를 기준으로 하며,
            정확성을 위해 노력하지만 시점에 따라 내용이 달라질 수 있습니다.
          </p>
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
