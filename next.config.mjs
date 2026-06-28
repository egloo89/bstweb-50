/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  swcMinify: true,
  async redirects() {
    return [
      // 기존 vercel.app 주소로 들어오면 새 도메인으로 영구 이동 (SEO 통합)
      {
        source: "/:path*",
        has: [{ type: "host", value: "boostwebstudio.vercel.app" }],
        destination: "https://www.blackbayblog.com/:path*",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
