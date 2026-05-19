import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Black Bay Blog (블랙베이 블로그)",
    template: "%s | Black Bay Blog",
  },
  description: "AI, 웹개발, 디자인, 생산성에 대한 깊이 있는 한국어 기술 블로그.",
  keywords: ["AI", "웹개발", "프로그래밍", "Next.js", "한국 블로그", "블랙베이"],
  authors: [{ name: "Black Bay Blog" }],
  openGraph: {
    title: "Black Bay Blog (블랙베이 블로그)",
    description: "AI & 웹개발 인사이트 블로그",
    type: "website",
    locale: "ko_KR",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Maru+Buri:wght@300;400;500;600;700&family=Nanum+Gothic:wght@400;700;800&family=Nanum+Gothic+Coding&family=Nanum+Myeongjo:wght@400;700;800&family=Nanum+Pen+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
