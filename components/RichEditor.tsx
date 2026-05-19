"use client"

import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
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
  ChevronUp, GripVertical,
} from "lucide-react"

/* ── 네이버 무료 폰트 ────────────────────────────────────────────── */
const FONTS = [
  { label: "기본체", value: "" },
  { label: "마루부리", value: "'Maru Buri', serif" },
  { label: "나눔고딕", value: "'Nanum Gothic', sans-serif" },
  { label: "나눔명조", value: "'Nanum Myeongjo', serif" },
  { label: "나눔손글씨펜", value: "'Nanum Pen Script', cursive" },
  { label: "나눔고딕코딩", value: "'Nanum Gothic Coding', monospace" },
]

/* ── 이미지 NodeView — 선택 표시 + 드래그 핸들 ──────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ImageNodeView = ({ node, selected }: { node: any; selected: boolean }) => (
  <NodeViewWrapper
    as={"span" as React.ElementType}
    data-drag-handle
    contentEditable={false}
    style={{
      display: "inline-block",
      position: "relative",
      cursor: selected ? "grab" : "default",
      userSelect: "none",
      verticalAlign: "bottom",
    }}
  >
    <img
      src={node.attrs.src}
      alt={node.attrs.alt || ""}
      draggable={false}
      style={{
        maxWidth: "100%",
        display: "block",
        borderRadius: 8,
        margin: "8px 0",
        outline: selected ? "2.5px solid #4361ee" : "2.5px solid transparent",
        outlineOffset: 2,
        transition: "outline 0.1s",
      }}
    />
    {/* 선택 시 상단 뱃지 */}
    {selected && (
      <span style={{
        position: "absolute", top: 14, left: "50%",
        transform: "translateX(-50%)",
        background: "#4361ee", color: "#fff",
        fontSize: 11, padding: "3px 10px",
        borderRadius: 4, whiteSpace: "nowrap",
        pointerEvents: "none", display: "flex",
        alignItems: "center", gap: 4,
      }}>
        <GripVertical size={11} />드래그하여 이동
      </span>
    )}
  </NodeViewWrapper>
)

/* 드래그 가능 이미지 확장 */
const DraggableImage = ImageExt.extend({
  draggable: true,
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})

/* ── Custom iframe node ─────────────────────────────────────────── */
const IFrameNode = Node.create({
  name: "iframe", group: "block", atom: true,
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
      ["iframe", mergeAttributes(HTMLAttributes, { width: "100%", frameborder: "0", allowfullscreen: "true" })]]
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
async function uploadToFirebase(file: File, onProgress: (p: number) => void): Promise<string> {
  const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage")
  const storage = await getFbStorage()
  const path = `blog-images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), file)
    task.on("state_changed",
      snap => onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    )
  })
}

/* ── 업로드 진행 항목 타입 ─────────────────────────────────────── */
interface UploadTask { id: string; name: string; progress: number; error?: string }

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 모달용 단일 업로드 상태
  const [modalUploading, setModalUploading] = useState(false)
  const [modalProgress, setModalProgress] = useState(0)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalPreview, setModalPreview] = useState<string | null>(null)

  // 인라인(드래그&드롭) 다중 업로드 상태
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([])

  const [videoUrl, setVideoUrl] = useState("")
  const [mapSrc, setMapSrc] = useState("")
  const [mapHeight, setMapHeight] = useState("400")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [tableRows, setTableRows] = useState("3")
  const [tableCols, setTableCols] = useState("3")

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (headingRef.current && !headingRef.current.contains(e.target as globalThis.Node)) setHeadingOpen(false)
      if (fontRef.current && !fontRef.current.contains(e.target as globalThis.Node)) setFontOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // 다중 파일 업로드 함수를 ref에 보관 (useEditor handleDrop에서 사용)
  const uploadFilesRef = useRef<((files: File[], pos?: number) => void) | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, link: false }),
      DraggableImage.configure({ allowBase64: true }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: "text-[#4361ee] underline", target: "_blank" } }),
      Youtube.configure({ width: 640, height: 400 }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Color, TextStyle, FontFamily, FontSize,
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
      Placeholder.configure({ placeholder: "내용을 입력하세요..." }),
      IFrameNode,
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "rich-editor-body outline-none min-h-[520px] p-5 prose-content" },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files || [])
        const imgs = files.filter(f => f.type.startsWith("image/"))
        if (imgs.length > 0) {
          event.preventDefault()
          const coords = { left: event.clientX, top: event.clientY }
          const pos = view.posAtCoords(coords)?.pos
          uploadFilesRef.current?.(imgs, pos)
          return true
        }
        return false
      },
      handlePaste(_view, event) {
        const items = Array.from(event.clipboardData?.items || [])
        const imgs = items
          .filter(i => i.type.startsWith("image/"))
          .map(i => i.getAsFile())
          .filter((f): f is File => f !== null)
        if (imgs.length > 0) {
          uploadFilesRef.current?.(imgs)
          return true
        }
        return false
      },
    },
  })

  /* ── 다중 이미지 업로드 ── */
  const uploadFiles = useCallback(async (files: File[], insertPos?: number) => {
    if (!editor) return
    const tasks: UploadTask[] = files.map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      progress: 0,
    }))
    setUploadTasks(prev => [...prev, ...tasks])

    await Promise.allSettled(files.map(async (file, i) => {
      const taskId = tasks[i].id
      try {
        const url = await uploadToFirebase(file, progress => {
          setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress } : t))
        })
        // 드롭 위치에 삽입, 없으면 현재 커서 위치에 삽입
        if (insertPos != null) {
          editor.chain().insertContentAt(insertPos, { type: "image", attrs: { src: url } }).run()
        } else {
          editor.chain().focus().setImage({ src: url }).run()
        }
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 100 } : t))
        // 완료 후 1.5초 뒤 제거
        setTimeout(() => setUploadTasks(prev => prev.filter(t => t.id !== taskId)), 1500)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "업로드 실패"
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, error: msg } : t))
        setTimeout(() => setUploadTasks(prev => prev.filter(t => t.id !== taskId)), 3000)
      }
    }))
  }, [editor])

  // ref 동기화
  uploadFilesRef.current = uploadFiles

  if (!editor) return (
    <div className="border border-gray-200 rounded-lg bg-white flex items-center justify-center" style={{ minHeight: 560 }}>
      <span className="text-gray-400 text-sm">에디터 초기화 중...</span>
    </div>
  )

  const fsRaw = editor.getAttributes("textStyle").fontSize as string | undefined
  const currentFontSize = fsRaw ? parseInt(fsRaw) || 15 : 15
  function applyFontSize(size: number) {
    editor.chain().focus().setFontSize(`${Math.min(72, Math.max(8, size))}px`).run()
  }
  const currentFont = editor.getAttributes("textStyle").fontFamily as string || ""

  function onModalFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) uploadFiles(files)
    e.target.value = ""
    setModal(null)
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
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ position: "relative" }}>
      {/* ── Toolbar ── */}
      <div className="border-b border-gray-200 bg-gray-50 px-2 py-1.5 flex flex-wrap gap-0.5 items-center">
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="되돌리기">
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="다시실행">
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />

        {/* 제목 스타일 */}
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

        {/* 폰트 선택 */}
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
          <button type="button" title="크기 줄이기" onClick={() => applyFontSize(currentFontSize - 1)}
            className="px-1.5 h-full text-gray-500 hover:bg-gray-100 transition-colors flex items-center">
            <Minus className="h-2.5 w-2.5" />
          </button>
          <input type="number" min={8} max={72} value={currentFontSize}
            onChange={e => applyFontSize(Number(e.target.value))}
            className="w-9 text-center text-xs text-gray-700 focus:outline-none bg-transparent" />
          <button type="button" title="크기 늘리기" onClick={() => applyFontSize(currentFontSize + 1)}
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

      {/* ── 에디터 본문 ── */}
      <EditorContent editor={editor} />

      {/* ── 다중 업로드 진행 상황 오버레이 ── */}
      {uploadTasks.length > 0 && (
        <div style={{
          position: "absolute", bottom: 12, right: 12,
          display: "flex", flexDirection: "column", gap: 6,
          zIndex: 10, pointerEvents: "none",
        }}>
          {uploadTasks.map(task => (
            <div key={task.id} style={{
              background: task.error ? "#fee2e2" : "#fff",
              border: `1px solid ${task.error ? "#fca5a5" : "#e5e7eb"}`,
              borderRadius: 8, padding: "6px 12px",
              minWidth: 200, boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: task.error ? "#dc2626" : "#374151",
                  maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {task.error ? `❌ ${task.name}` : task.progress >= 100 ? `✅ ${task.name}` : `⬆ ${task.name}`}
                </span>
                <span style={{ fontSize: 11, color: "#6b7280" }}>
                  {task.error ? "실패" : `${task.progress}%`}
                </span>
              </div>
              {!task.error && (
                <div style={{ height: 3, background: "#e5e7eb", borderRadius: 2 }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    background: task.progress >= 100 ? "#22c55e" : "#4361ee",
                    width: `${task.progress}%`, transition: "width 0.2s",
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {modal === "image" && (
        <Modal title="이미지 업로드" onClose={() => { if (!modalUploading) { setModal(null); setModalPreview(null); setModalError(null) } }}>
          <div className="space-y-3">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onModalFileChange} />
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))
                if (files.length > 0) { uploadFiles(files); setModal(null) }
              }}
              onClick={() => !modalUploading && fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#4361ee]/50 hover:bg-gray-50 transition-colors"
              style={{ minHeight: 140 }}>
              <Upload className="h-8 w-8 text-gray-300" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">클릭하거나 이미지를 드래그하세요</p>
                <p className="text-xs text-gray-400 mt-0.5">여러 장 동시 선택 가능 • JPG, PNG, GIF, WEBP</p>
              </div>
            </div>
            {modalError && <p className="text-xs text-red-500">{modalError}</p>}
            <div className="flex justify-end">
              <button type="button" onClick={() => setModal(null)} className={`${modalBtn} text-gray-600 hover:bg-gray-100`}>취소</button>
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
                className="w-24 px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none" />
            </div>
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
