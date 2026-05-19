"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import ImageExt from "@tiptap/extension-image"
import LinkExt from "@tiptap/extension-link"
import Youtube from "@tiptap/extension-youtube"
import TextAlign from "@tiptap/extension-text-align"
import { Color, TextStyle, FontFamily, FontSize } from "@tiptap/extension-text-style"
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table"
import Placeholder from "@tiptap/extension-placeholder"
import { Node, mergeAttributes } from "@tiptap/core"
import { useState, useRef, useCallback, useEffect } from "react"
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Quote, Code, Minus, ImageIcon, Video, Map, Link as LinkIcon,
  ChevronDown, X, Table as TableIcon, Undo, Redo, Type, Upload, Loader2,
  ChevronUp,
} from "lucide-react"

/* ── 네이버 무료 폰트 목록 ────────────────────────────────────────── */
const FONTS = [
  { label: "기본체", value: "" },
  { label: "마루부리", value: "'Maru Buri', serif" },
  { label: "나눔고딕", value: "'Nanum Gothic', sans-serif" },
  { label: "나눔명조", value: "'Nanum Myeongjo', serif" },
  { label: "나눔손글씨펜", value: "'Nanum Pen Script', cursive" },
  { label: "나눔고딕코딩", value: "'Nanum Gothic Coding', monospace" },
]

/* ── Custom iframe node ─────────────────────────────────────────── */
const IFrameNode = Node.create({
  name: "iframe",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      height: { default: "400" },
      title: { default: "" },
    }
  },
  parseHTML() { return [{ tag: "iframe[src]" }] },
  renderHTML({ HTMLAttributes }) {
    return ["div", { class: "iframe-wrapper" },
      ["iframe", mergeAttributes(HTMLAttributes, {
        width: "100%", frameborder: "0", allowfullscreen: "true",
      })],
    ]
  },
})

/* ── Firebase lazy loader ───────────────────────────────────────── */
let _fbStorage: unknown = null
async function getFbStorage() {
  if (_fbStorage) return _fbStorage as import("firebase/storage").FirebaseStorage
  const { storage } = await import("@/lib/firebase")
  _fbStorage = storage
  return storage
}

/* ── UI helpers ─────────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <button type="button" onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

const btnBase = "h-8 w-8 inline-flex items-center justify-center rounded text-sm transition-colors disabled:opacity-30"
const btnNormal = "text-gray-600 hover:bg-gray-100"
const btnActive = "bg-[#4361ee] text-white"

function ToolBtn({ onClick, active, title, disabled, children }: {
  onClick: () => void; active?: boolean; title?: string; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`${btnBase} ${active ? btnActive : btnNormal}`}>
      {children}
    </button>
  )
}

function Sep() { return <div className="w-px h-5 bg-gray-200 mx-0.5" /> }

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4361ee]/30"
const modalBtn = "px-4 py-1.5 text-sm rounded-md transition-colors"

/* ── Main component ─────────────────────────────────────────────── */
interface RichEditorProps { content: string; onChange: (html: string) => void }

export function RichEditor({ content, onChange }: RichEditorProps) {
  const [modal, setModal] = useState<"image" | "video" | "map" | "link" | "table" | null>(null)
  const [headingOpen, setHeadingOpen] = useState(false)
  const [fontOpen, setFontOpen] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const fontRef = useRef<HTMLDivElement>(null)

  const [imgUploading, setImgUploading] = useState(false)
  const [imgProgress, setImgProgress] = useState(0)
  const [imgError, setImgError] = useState<string | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [videoUrl, setVideoUrl] = useState("")
  const [mapSrc, setMapSrc] = useState("")
  const [mapHeight, setMapHeight] = useState("400")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [tableRows, setTableRows] = useState("3")
  const [tableCols, setTableCols] = useState("3")

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (headingRef.current && !headingRef.current.contains(e.target as globalThis.Node)) setHeadingOpen(false)
      if (fontRef.current && !fontRef.current.contains(e.target as globalThis.Node)) setFontOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // ref so handleDrop (created once in useEditor) always calls the latest uploadFile
  const uploadFnRef = useRef<((file: File) => void) | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, link: false }),
      ImageExt.configure({ allowBase64: true }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: "text-[#4361ee] underline", target: "_blank" } }),
      Youtube.configure({ width: 640, height: 400 }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Color,
      TextStyle,
      FontFamily,
      FontSize,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "내용을 입력하세요..." }),
      IFrameNode,
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "rich-editor-body outline-none min-h-[520px] p-5 prose-content" },
      // 에디터 영역에 이미지 직접 드래그&드롭
      handleDrop(_view, event) {
        const file = event.dataTransfer?.files?.[0]
        if (file?.type.startsWith("image/")) {
          event.preventDefault()
          uploadFnRef.current?.(file)
          return true
        }
        return false
      },
      // 클립보드 이미지 붙여넣기
      handlePaste(_view, event) {
        const items = Array.from(event.clipboardData?.items || [])
        const imgItem = items.find(i => i.type.startsWith("image/"))
        if (imgItem) {
          const file = imgItem.getAsFile()
          if (file) { uploadFnRef.current?.(file); return true }
        }
        return false
      },
    },
  })

  const uploadFile = useCallback(async (file: File) => {
    if (!editor) return
    if (!file.type.startsWith("image/")) { setImgError("이미지 파일만 업로드할 수 있습니다."); return }
    setImgError(null)
    setImgUploading(true)
    setImgProgress(0)
    setImgPreview(URL.createObjectURL(file))
    try {
      const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage")
      const storage = await getFbStorage()
      const path = `blog-images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
      const task = uploadBytesResumable(ref(storage, path), file)
      task.on("state_changed",
        snap => setImgProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
        err => { setImgError("업로드 실패: " + err.message); setImgUploading(false) },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref)
          editor.chain().focus().setImage({ src: url }).run()
          setImgUploading(false); setImgPreview(null); setModal(null)
        }
      )
    } catch (err: unknown) {
      setImgError("업로드 실패: " + (err instanceof Error ? err.message : String(err)))
      setImgUploading(false)
    }
  }, [editor])

  // ref를 최신 uploadFile로 동기화
  uploadFnRef.current = uploadFile

  if (!editor) return (
    <div className="border border-gray-200 rounded-lg bg-white flex items-center justify-center" style={{ minHeight: 560 }}>
      <span className="text-gray-400 text-sm">에디터 초기화 중...</span>
    </div>
  )

  // ── 현재 폰트 크기 ──
  const fsRaw = editor.getAttributes("textStyle").fontSize as string | undefined
  const currentFontSize = fsRaw ? parseInt(fsRaw) || 15 : 15
  function applyFontSize(size: number) {
    const v = Math.min(72, Math.max(8, size))
    editor.chain().focus().setFontSize(`${v}px`).run()
  }

  // ── 현재 폰트 패밀리 ──
  const currentFont = editor.getAttributes("textStyle").fontFamily as string || ""

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ""
  }
  function insertVideo() {
    if (!videoUrl.trim()) return
    editor.chain().focus().setYoutubeVideo({ src: videoUrl.trim() }).run()
    setVideoUrl(""); setModal(null)
  }
  function insertMap() {
    if (!mapSrc.trim()) return
    let src = mapSrc.trim()
    const m = src.match(/src="([^"]+)"/)
    if (m) src = m[1]
    editor.chain().focus().insertContent({ type: "iframe", attrs: { src, height: mapHeight } }).run()
    setMapSrc(""); setModal(null)
  }
  function insertLink() {
    if (!linkUrl.trim()) return
    if (linkText.trim() && editor.state.selection.empty) {
      editor.chain().focus().insertContent(
        `<a href="${linkUrl.trim()}" target="_blank">${linkText.trim()}</a>`
      ).run()
    } else {
      editor.chain().focus().setLink({ href: linkUrl.trim(), target: "_blank" }).run()
    }
    setLinkUrl(""); setLinkText(""); setModal(null)
  }
  function insertTable() {
    editor.chain().focus().insertTable({ rows: +tableRows || 3, cols: +tableCols || 3, withHeaderRow: true }).run()
    setModal(null)
  }

  const headingLevels: Array<{ label: string; level?: 1|2|3|4 }> = [
    { label: "본문" },
    { label: "제목 1", level: 1 },
    { label: "제목 2", level: 2 },
    { label: "제목 3", level: 3 },
    { label: "제목 4", level: 4 },
  ]
  const activeHeading = headingLevels.find(h =>
    h.level ? editor.isActive("heading", { level: h.level }) : editor.isActive("paragraph")
  ) || headingLevels[0]
  const activeFont = FONTS.find(f => f.value === currentFont) || FONTS[0]

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* ── Toolbar ── */}
      <div className="border-b border-gray-200 bg-gray-50 px-2 py-1.5 flex flex-wrap gap-0.5 items-center">

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="되돌리기">
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="다시실행">
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>

        <Sep />

        {/* 제목 스타일 드롭다운 */}
        <div className="relative" ref={headingRef}>
          <button type="button" onClick={() => { setHeadingOpen(o => !o); setFontOpen(false) }}
            className="h-8 flex items-center gap-1 px-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <Type className="h-3.5 w-3.5" />
            <span className="w-14 text-left text-xs">{activeHeading.label}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {headingOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[130px] py-1">
              {headingLevels.map(h => (
                <button key={h.label} type="button"
                  onClick={() => {
                    h.level ? editor.chain().focus().setHeading({ level: h.level }).run()
                             : editor.chain().focus().setParagraph().run()
                    setHeadingOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors
                    ${(h.level ? editor.isActive("heading", { level: h.level }) : editor.isActive("paragraph"))
                      ? "text-[#4361ee] font-semibold" : "text-gray-700"}`}>
                  {h.level
                    ? <span style={{ fontSize: `${1.4 - h.level * 0.1}em`, fontWeight: "bold" }}>{h.label}</span>
                    : h.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 폰트 선택 드롭다운 */}
        <div className="relative" ref={fontRef}>
          <button type="button" onClick={() => { setFontOpen(o => !o); setHeadingOpen(false) }}
            className="h-8 flex items-center gap-1 px-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <span className="w-20 text-left text-xs truncate" style={{ fontFamily: activeFont.value || undefined }}>
              {activeFont.label}
            </span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {fontOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px] py-1">
              {FONTS.map(f => (
                <button key={f.value} type="button"
                  onClick={() => {
                    if (f.value) editor.chain().focus().setFontFamily(f.value).run()
                    else editor.chain().focus().unsetFontFamily().run()
                    setFontOpen(false)
                  }}
                  style={{ fontFamily: f.value || undefined }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors
                    ${currentFont === f.value ? "text-[#4361ee] font-semibold" : "text-gray-700"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 글씨 크기 */}
        <div className="flex items-center border border-gray-200 rounded bg-white h-8 overflow-hidden">
          <button type="button" title="글씨 크기 줄이기"
            onClick={() => applyFontSize(currentFontSize - 1)}
            className="px-1.5 h-full text-gray-500 hover:bg-gray-100 transition-colors flex items-center">
            <Minus className="h-2.5 w-2.5" />
          </button>
          <input
            type="number" min={8} max={72}
            value={currentFontSize}
            onChange={e => applyFontSize(Number(e.target.value))}
            className="w-9 text-center text-xs text-gray-700 focus:outline-none bg-transparent"
          />
          <button type="button" title="글씨 크기 늘리기"
            onClick={() => applyFontSize(currentFontSize + 1)}
            className="px-1.5 h-full text-gray-500 hover:bg-gray-100 transition-colors flex items-center">
            <ChevronUp className="h-2.5 w-2.5" />
          </button>
        </div>

        <Sep />

        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="굵게">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="기울임">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="밑줄">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="취소선">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolBtn>

        {/* 글자 색상 */}
        <div className="relative h-8 w-8 inline-flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer" title="글자 색상">
          <span className="text-xs font-bold text-gray-700 select-none">A</span>
          <div className="absolute bottom-1 left-1.5 right-1.5 h-0.5 rounded pointer-events-none"
            style={{ backgroundColor: editor.getAttributes("textStyle").color || "#374151" }} />
          <input type="color" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={e => editor.chain().focus().setColor(e.target.value).run()} />
        </div>

        <Sep />

        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="왼쪽 정렬">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="가운데 정렬">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="오른쪽 정렬">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolBtn>

        <Sep />

        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="글머리 기호">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="번호 목록">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="인용문">
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="인라인 코드">
          <Code className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">
          <Minus className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => setModal("table")} title="표 삽입">
          <TableIcon className="h-3.5 w-3.5" />
        </ToolBtn>

        <Sep />

        {[
          { icon: <ImageIcon className="h-3.5 w-3.5" />, label: "이미지", id: "image" as const },
          { icon: <Video className="h-3.5 w-3.5" />, label: "동영상", id: "video" as const },
          { icon: <Map className="h-3.5 w-3.5" />, label: "지도", id: "map" as const },
          { icon: <LinkIcon className="h-3.5 w-3.5" />, label: "링크", id: "link" as const },
        ].map(({ icon, label, id }) => (
          <button key={id} type="button"
            onClick={() => {
              if (id === "link") {
                const sel = editor.state.selection
                setLinkText(editor.state.doc.textBetween(sel.from, sel.to))
              }
              setModal(id)
            }}
            className="h-8 flex items-center gap-1 px-2 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            {icon}<span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Editor body (드래그 앤 드롭은 editorProps.handleDrop에서 처리) ── */}
      <EditorContent editor={editor} />

      {/* ── Modals ── */}
      {modal === "image" && (
        <Modal title="이미지 업로드" onClose={() => { if (!imgUploading) { setModal(null); setImgPreview(null); setImgError(null) } }}>
          <div className="space-y-3">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) uploadFile(f) }}
              onClick={() => !imgUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                ${imgUploading ? "border-[#4361ee]/40 bg-blue-50 cursor-default" : "border-gray-200 hover:border-[#4361ee]/50 hover:bg-gray-50"}`}
              style={{ minHeight: 140 }}>
              {imgUploading ? (
                <>
                  {imgPreview && <img src={imgPreview} alt="" className="h-20 w-auto rounded object-cover" />}
                  <div className="flex items-center gap-2 text-sm text-[#4361ee]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>업로드 중... {imgProgress}%</span>
                  </div>
                  <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4361ee] transition-all" style={{ width: `${imgProgress}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-300" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">클릭하거나 이미지를 드래그하세요</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, GIF, WEBP 지원</p>
                  </div>
                </>
              )}
            </div>
            {imgError && <p className="text-xs text-red-500">{imgError}</p>}
            <div className="flex justify-end">
              <button type="button" onClick={() => { setModal(null); setImgPreview(null); setImgError(null) }}
                disabled={imgUploading} className={`${modalBtn} text-gray-600 hover:bg-gray-100 disabled:opacity-50`}>
                취소
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "video" && (
        <Modal title="동영상 삽입 (YouTube)" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-700">YouTube URL</label>
            <input autoFocus type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && insertVideo()}
              className={inputCls} placeholder="https://www.youtube.com/watch?v=..." />
            <p className="text-xs text-gray-400">YouTube 공유 URL 또는 일반 URL 모두 지원합니다.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)} className={`${modalBtn} text-gray-600 hover:bg-gray-100`}>취소</button>
              <button type="button" onClick={insertVideo} disabled={!videoUrl.trim()}
                className={`${modalBtn} bg-[#4361ee] text-white hover:bg-[#3451d1] disabled:opacity-50`}>삽입</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "map" && (
        <Modal title="지도 삽입" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-700">지도 삽입 코드 또는 URL</label>
            <textarea autoFocus value={mapSrc} onChange={e => setMapSrc(e.target.value)}
              className={`${inputCls} min-h-[80px] font-mono text-xs`}
              placeholder={'<iframe src="https://..." ...></iframe>\n또는 URL만 입력'} />
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">높이 (px)</label>
              <input type="number" value={mapHeight} onChange={e => setMapHeight(e.target.value)}
                className="w-24 px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4361ee]/30" />
            </div>
            <p className="text-xs text-gray-400">Google Maps / 네이버 지도 → 공유 → 지도 퍼가기 코드를 붙여넣으세요.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)} className={`${modalBtn} text-gray-600 hover:bg-gray-100`}>취소</button>
              <button type="button" onClick={insertMap} disabled={!mapSrc.trim()}
                className={`${modalBtn} bg-[#4361ee] text-white hover:bg-[#3451d1] disabled:opacity-50`}>삽입</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "link" && (
        <Modal title="링크 삽입" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">URL *</label>
              <input autoFocus type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && insertLink()}
                className={inputCls} placeholder="https://example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">링크 텍스트</label>
              <input type="text" value={linkText} onChange={e => setLinkText(e.target.value)}
                className={inputCls} placeholder="텍스트를 선택한 상태면 자동 적용됩니다" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)} className={`${modalBtn} text-gray-600 hover:bg-gray-100`}>취소</button>
              <button type="button" onClick={insertLink} disabled={!linkUrl.trim()}
                className={`${modalBtn} bg-[#4361ee] text-white hover:bg-[#3451d1] disabled:opacity-50`}>삽입</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "table" && (
        <Modal title="표 삽입" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">행 수</label>
                <input type="number" min="2" max="20" value={tableRows} onChange={e => setTableRows(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">열 수</label>
                <input type="number" min="2" max="10" value={tableCols} onChange={e => setTableCols(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)} className={`${modalBtn} text-gray-600 hover:bg-gray-100`}>취소</button>
              <button type="button" onClick={insertTable}
                className={`${modalBtn} bg-[#4361ee] text-white hover:bg-[#3451d1]`}>삽입</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
