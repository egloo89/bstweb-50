"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function DeletePostButton({ slug }: { slug: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDelete() {
    if (!confirm(`정말 "${slug}" 게시글을 삭제하시겠습니까?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/admin/api/posts/${encodeURIComponent(slug)}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      router.refresh()
    } catch {
      alert("삭제 실패")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-md border border-destructive/30 text-destructive px-2 py-1 text-xs hover:bg-destructive/10 disabled:opacity-50"
    >
      <Trash2 className="h-3 w-3" /> {loading ? "삭제중..." : "삭제"}
    </button>
  )
}
