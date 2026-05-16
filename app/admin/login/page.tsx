"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, BookOpen } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/admin/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || "로그인 실패")
        setLoading(false)
        return
      }
      router.push("/admin")
      router.refresh()
    } catch {
      setError("네트워크 오류")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-lg"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">관리자 로그인</h1>
          <p className="text-sm text-muted-foreground mt-1">BoostWeb Blog 관리 콘솔</p>
        </div>

        <label className="block">
          <span className="text-sm font-medium">비밀번호</span>
          <div className="mt-1.5 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="••••••••"
            />
          </div>
        </label>

        {error && (
          <p className="mt-3 text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          기본 비밀번호: <code className="bg-muted px-1 rounded">admin123</code> (개발용)
        </p>
      </form>
    </div>
  )
}
