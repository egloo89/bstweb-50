"use client"

import { useState } from "react"
import { Loader2, X } from "lucide-react"

interface Props {
  type: "ai" | "finance" | "loan" | "issue"
  label: string
  onClose: () => void
  onSuccess: (msg: string) => void
}

export function AutoPostModal({ type, label, onClose, onSuccess }: Props) {
  const [count, setCount] = useState(1)
  const [scheduleMode, setScheduleMode] = useState<"immediate" | "interval">("immediate")
  const [keywords, setKeywords] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const kwList = type === "issue"
      ? keywords.split(",").map(k => k.trim()).filter(Boolean).slice(0, 10)
      : []

    try {
      const res = await fetch("/admin/api/auto-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          count,
          scheduled: scheduleMode === "interval",
          keywords: kwList,
        }),
      })
      const data = await res.json()

      if (!data.ok && data.error) {
        setError(`오류: ${data.error}`)
        return
      }

      const okLines: string[] = []
      if (data.results?.length > 0) {
        data.results.forEach((r: { category: string; title: string }) => {
          okLines.push(`✅ [${r.category}] ${r.title}`)
        })
      }
      if (data.plan) {
        okLines.push(`📅 예약 플랜 생성: ${data.plan.totalCount - data.plan.publishedCount}개 대기 중 (${data.plan.label})`)
      }
      if (data.errors?.length > 0) {
        data.errors.forEach((e: { category: string; error: string }) => {
          okLines.push(`❌ [${e.category}] ${e.error}`)
        })
      }

      onSuccess(okLines.join("\n") || "포스팅 완료")
      onClose()
    } catch (e) {
      setError(`네트워크 오류: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <button
          onClick={onClose}
          className="p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Keywords (issue only) */}
        {type === "issue" && (
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              키워드 (쉼표 구분, 최대 10개)
            </label>
            <textarea
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="예: 삼성전자 실적, 금리 인하, AI 반도체..."
              rows={2}
              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none bg-white"
            />
          </div>
        )}

        {/* Count */}
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            생성 개수
          </label>
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={e => setCount(Math.min(Math.max(Number(e.target.value) || 1, 1), 1000))}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white"
          />
        </div>

        {/* Schedule mode */}
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1.5">발행 방식</label>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name={`schedule-${type}`}
                value="immediate"
                checked={scheduleMode === "immediate"}
                onChange={() => setScheduleMode("immediate")}
                className="text-[#4361ee]"
              />
              <span className="text-xs text-gray-700">즉시 발행 (최대 5개)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name={`schedule-${type}`}
                value="interval"
                checked={scheduleMode === "interval"}
                onChange={() => setScheduleMode("interval")}
                className="text-[#4361ee]"
              />
              <span className="text-xs text-gray-700">4~6시간 간격 자동 예약</span>
            </label>
          </div>
          {scheduleMode === "immediate" && count > 5 && (
            <p className="mt-1 text-[10px] text-amber-600">즉시 발행은 최대 5개까지 처리됩니다.</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-[11px] text-red-500 bg-red-50 rounded px-2 py-1.5">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || (type === "issue" && !keywords.trim())}
          className="w-full py-2 rounded-lg bg-[#4361ee] text-white text-xs font-medium hover:bg-[#3451d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 생성 중...</>
          ) : (
            "포스팅 시작"
          )}
        </button>
      </div>
    </div>
  )
}
