import type { Metadata } from "next"
import Script from "next/script"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ADSENSE_CLIENT } from "@/components/AdSense"

export const metadata: Metadata = {
  title: {
    default: "BoostWeb Blog - AI & 웹개발 인사이트",
    template: "%s | BoostWeb Blog",
  },
  description: "AI, 웹개발, 디자인, 생산성에 대한 깊이 있는 한국어 기술 블로그.",
  keywords: ["AI", "웹개발", "프로그래밍", "Next.js", "한국 블로그"],
  authors: [{ name: "BoostWeb" }],
  openGraph: {
    title: "BoostWeb Blog",
    description: "AI & 웹개발 인사이트 블로그",
    type: "website",
    locale: "ko_KR",
  },
  other: {
    "google-adsense-account": ADSENSE_CLIENT,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <Script
          id="adsense-script"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
