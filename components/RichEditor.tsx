"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import ImageExt from "@tiptap/extension-image"
import LinkExt from "@tiptap/extension-link"
import Youtube from "@tiptap/extension-youtube"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import { Color } from "@tiptap/extension-color"
import TextStyle from "@tiptap/extension-text-style"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableHeader from "@tiptap/extension-table-header"
import TableCell from "@tiptap/extension-table-cell"
import Placeholder from "@tiptap/extension-placeholder"
import { Node, mergeAttributes } from "@tiptap/core"
import { useState, useEffect, useRef, useCallback } from "react"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Quote, Code, Minus, ImageIcon, Video, Map, Link as LinkIcon,
  ChevronDown, X, Table as TableIcon, Undo, Redo, Type, Upload, Loader2,
} from "lucide-react"

/* ── Custom iframe node (지도 등) ─────────────────────────────────── */
const IFrameNode = Node.create({
  name: "iframe",
  group: "block",
  atom: true,
  draggable: true,
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

/* ── Small UI helpers ─────────────────────────────────────────────── */
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

/* ── Main component ───────────────────────────────────────────────── */
interface RichEditorProps { content: string; onChange: (html: string) => void }

export function RichEditor({ content, onChange }: RichEditorProps) {
  const [modal, setModal] = useState<"image" | "video" | "map" | "link" | "table" | null>(null)
  const [headingOpen, setHeadingOpen] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)

  // image upload state
  const [imgUploading, setImgUploading] = useState(false)
  const [imgProgress, setImgProgress] = useState(0)
  const [imgError, setImgError] = useState<string | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // modal field state
  const [videoUrl, setVideoUrl] = useState("")
  const [mapSrc, setMapSrc] = useState("")
  const [mapHeight, setMapHeight] = useState("400")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [tableRows, setTableRows] = useState("3")
  const [tableCols, setTableCols] = useState("3")

  // close heading dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) setHeadingOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      ImageExt.configure({ allowBase64: true }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: "text-[#4361ee] underline", target: "_blank" } }),
      Youtube.configure({ width: "100%", height: 400 }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Color,
      TextStyle,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "내용을 입력하세요..." }),
      IFrameNode,
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "rich-editor-body outline-none min-h-[520px] p-5 prose-content" } },
  })

  if (!editor) return null

  /* image upload to Firebase */
  const uploadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setImgError("이미지 파일만 업로드할 수 있습니다."); return }
    setImgError(null)
    setImgUploading(true)
    setImgProgress(0)
    setImgPreview(URL.createObjectURL(file))

    const path = `blog-images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const task = uploadBytesResumable(ref(storage, path), file)

    task.on("state_changed",
      snap => setImgProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      err => { setImgError("업로드 실패: " + err.message); setImgUploading(false) },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        editor.chain().focus().setImage({ src: url }).run()
        setImgUploading(false)
        setImgPreview(null)
        setModal(null)
      }
    )
  }, [editor])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
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

  /* heading label */
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

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* ── Toolbar ── */}
      <div className="border-b border-gray-200 bg-gray-50 px-2 py-1.5 flex flex-wrap gap-0.5 items-center">

        {/* Undo / Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="되돌리기">
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="다시실행">
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>

        <Sep />

        {/* Heading dropdown */}
        <div className="relative" ref={headingRef}>
          <button type="button" onClick={() => setHeadingOpen(o => !o)}
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

        <Sep />

        {/* Bold / Italic / Underline / Strike */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="굵게 (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="기울임 (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="밑줄 (Ctrl+U)">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="취소선">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolBtn>

        {/* Color picker */}
        <div className="relative h-8 w-8 inline-flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer" title="글자 색상">
          <span className="text-xs font-bold text-gray-700 select-none">A</span>
          <div className="absolute bottom-1 left-1.5 right-1.5 h-0.5 rounded pointer-events-none"
            style={{ backgroundColor: editor.getAttributes("textStyle").color || "#374151" }} />
          <input type="color" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={e => editor.chain().focus().setColor(e.target.value).run()} />
        </div>

        <Sep />

        {/* Alignment */}
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

        {/* Lists / Quote / Code / HR */}
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

        {/* Insert buttons */}
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

      {/* ── Editor body ── */}
      <EditorContent editor={editor} />

      {/* ── Modals ── */}
      {modal === "image" && (
        <Modal title="이미지 업로드" onClose={() => { if (!imgUploading) { setModal(null); setImgPreview(null); setImgError(null) } }}>
          <div className="space-y-3">
            {/* 숨김 파일 input */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

            {/* 드래그앤드롭 영역 */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => !imgUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                ${imgUploading ? "border-[#4361ee]/40 bg-blue-50 cursor-default" : "border-gray-200 hover:border-[#4361ee]/50 hover:bg-gray-50"}`}
              style={{ minHeight: 140 }}
            >
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
                disabled={imgUploading}
                className={`${modalBtn} text-gray-600 hover:bg-gray-100 disabled:opacity-50`}>
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
                <input type="number" min="2" max="20" value={tableRows} onChange={e => setTableRows(e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">열 수</label>
                <input type="number" min="2" max="10" value={tableCols} onChange={e => setTableCols(e.target.value)}
                  className={inputCls} />
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
