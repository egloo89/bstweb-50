import { BlogHeader } from "@/components/BlogHeader"
import { SiteFooter } from "@/components/SiteFooter"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "개인정보처리방침 | Black Bay Blog",
  description: "Black Bay Blog의 개인정보처리방침입니다.",
}

export default function PrivacyPage() {
  const today = "2026년 5월 20일"
  return (
    <div className="blog-container">
      <BlogHeader />
      <main className="max-w-3xl mx-auto px-5 py-10 text-sm text-gray-700 leading-relaxed">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
        <p className="text-xs text-gray-400 mb-8">최종 수정일: {today}</p>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">1. 개요</h2>
          <p>
            Black Bay Blog(이하 "블로그")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관련 법령을 준수합니다.
            본 방침은 블로그가 수집하는 정보, 사용 방법, 제3자 공유 여부 등을 안내합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">2. 수집하는 정보</h2>
          <p className="mb-2">블로그는 다음과 같은 정보를 수집할 수 있습니다:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>방문 페이지, 체류 시간, 클릭 경로 등 <strong>익명 사용 통계</strong></li>
            <li>IP 주소, 브라우저 유형, 운영체제 등 <strong>기술적 정보</strong></li>
            <li>쿠키 및 유사 추적 기술을 통한 <strong>이용 패턴 정보</strong></li>
            <li>문의 시 이용자가 직접 제공하는 <strong>이메일 주소 및 메시지</strong></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">3. 정보 수집 및 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>블로그 서비스 운영 및 콘텐츠 품질 개선</li>
            <li>방문자 통계 분석 및 사용자 경험 향상</li>
            <li>맞춤형 광고 제공 (Google AdSense)</li>
            <li>문의 사항 처리 및 응답</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">4. 쿠키(Cookie) 정책</h2>
          <p className="mb-2">
            블로그는 서비스 개선 및 광고 최적화를 위해 쿠키를 사용합니다. 쿠키는 이용자의 브라우저에 저장되는 소규모 텍스트 파일입니다.
          </p>
          <p className="mb-2">사용되는 쿠키 유형:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>필수 쿠키:</strong> 블로그 기본 기능 작동에 필요</li>
            <li><strong>분석 쿠키:</strong> Google Analytics를 통한 방문자 통계 수집</li>
            <li><strong>광고 쿠키:</strong> Google AdSense를 통한 맞춤 광고 제공</li>
          </ul>
          <p className="mt-2">
            브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">5. 제3자 서비스</h2>
          <p className="mb-2">블로그는 다음 제3자 서비스를 사용합니다:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Google AdSense:</strong> 광고 표시를 위해 Google이 쿠키를 사용할 수 있습니다.
              Google의 광고 쿠키 사용에 대한 자세한 내용은{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#4361ee] underline">
                Google 개인정보처리방침
              </a>
              을 참조하세요.
            </li>
            <li>
              <strong>Google Analytics:</strong> 방문자 통계 분석을 위해 사용됩니다. 수집된 데이터는 익명으로 처리됩니다.
            </li>
            <li>
              <strong>Vercel:</strong> 블로그 호스팅 서비스로, 서버 접속 로그를 수집할 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">6. 개인정보 보유 및 파기</h2>
          <p>
            수집된 개인정보는 수집 목적이 달성된 후 지체 없이 파기합니다.
            단, 관련 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 안전하게 보관 후 파기합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">7. 이용자의 권리</h2>
          <p className="mb-2">이용자는 다음의 권리를 행사할 수 있습니다:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>개인정보 수집·이용에 대한 동의 철회</li>
            <li>수집된 개인정보 열람, 수정, 삭제 요청</li>
            <li>맞춤 광고 거부 (Google 광고 설정에서 변경 가능)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">8. 개인정보 보호책임자</h2>
          <p>개인정보 관련 문의사항은 아래로 연락해 주세요:</p>
          <ul className="list-none mt-2 space-y-1">
            <li>블로그명: Black Bay Blog</li>
            <li>이메일: <a href="mailto:pianosound4@gmail.com" className="text-[#4361ee] underline">pianosound4@gmail.com</a></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">9. 방침 변경</h2>
          <p>
            본 개인정보처리방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며,
            변경 시 블로그 내 공지를 통해 안내합니다.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
