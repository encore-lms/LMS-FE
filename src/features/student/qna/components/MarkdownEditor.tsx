import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from 'react'
import { Bold, Code, Image as ImageIcon, Link2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Markdown } from '@/components/ui/Markdown'
import { putImage } from '@/components/ui/markdownImages'

// 이미지 인라인 가드 — 이미지 타입만, 2MB 이하(프로토타입 base64 인라인이라 과대 방지).
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

interface MarkdownEditorProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minHeight?: number
  maxLength?: number
  /** 전달 시 @멘션 자동완성 활성 */
  mentionNames?: string[]
  /** 본문에서 파싱된 멘션 이름들 콜백 */
  onMentionsChange?: (names: string[]) => void
  onImageRejected?: (reason: string) => void
}

// 마크다운 작성기 — 작성/미리보기 탭 + 툴바(굵게·코드·링크·이미지) + 이미지 base64 + @멘션.
// QnA 질문 폼·답변 작성기·댓글 작성기 공용. (react-quill 대체 — React 19 안전)
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 140,
  maxLength = 5000,
  mentionNames,
  onMentionsChange,
  onImageRejected,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const ref = useRef<HTMLTextAreaElement>(null)
  // insertAtCursor 후 복원할 캐럿 위치(렌더 후 적용).
  const pendingCaret = useRef<number | null>(null)
  // 멘션 자동완성 상태 — 활성 토큰 시작 위치 + 후보.
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)

  useLayoutEffect(() => {
    if (pendingCaret.current != null && ref.current) {
      const pos = pendingCaret.current
      ref.current.focus()
      ref.current.setSelectionRange(pos, pos)
      pendingCaret.current = null
    }
  })

  // 본문 → 멘션 이름 파싱(전달된 명단 중 @이름 으로 등장한 것).
  useEffect(() => {
    if (!onMentionsChange) return
    if (!mentionNames || mentionNames.length === 0) {
      onMentionsChange([])
      return
    }
    const hit = mentionNames.filter((n) => value.includes(`@${n}`))
    onMentionsChange(hit)
  }, [value, mentionNames, onMentionsChange])

  const setValue = (next: string, caret?: number) => {
    if (caret != null) pendingCaret.current = caret
    onChange(next.slice(0, maxLength))
  }

  // 선택 영역을 prefix/suffix 로 감싸기(굵게·코드·링크).
  const wrap = (prefix: string, suffix: string, sample: string) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const sel = value.slice(start, end) || sample
    const next =
      value.slice(0, start) + prefix + sel + suffix + value.slice(end)
    setValue(next, start + prefix.length + sel.length + suffix.length)
  }

  const insert = (text: string) => {
    const el = ref.current
    const at = el ? el.selectionStart : value.length
    const next = value.slice(0, at) + text + value.slice(at)
    setValue(next, at + text.length)
  }

  const addImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onImageRejected?.('이미지 파일만 첨부할 수 있어요')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onImageRejected?.('이미지는 2MB 이하만 첨부할 수 있어요')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      // 거대한 base64 를 본문에 직접 넣지 않고 짧은 attachment 참조로 삽입(렌더 시 해석).
      const id = putImage(dataUrl)
      insert(`\n![${file.name}](attachment:${id})\n`)
      // 첨부 직후 결과를 바로 확인할 수 있게 미리보기로 전환.
      setTab('preview')
    }
    reader.readAsDataURL(file)
  }

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const img = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith('image/'),
    )
    if (img) {
      const file = img.getAsFile()
      if (file) {
        e.preventDefault()
        addImageFile(file)
      }
    }
  }

  const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith('image/'),
    )
    if (file) {
      e.preventDefault()
      addImageFile(file)
    }
  }

  // 입력 변화 시 @멘션 토큰 감지(커서 직전 @비공백 연속).
  const handleChange = (next: string) => {
    setValue(next)
    if (!mentionNames || mentionNames.length === 0) return
    const el = ref.current
    const caret = el
      ? el.selectionStart + (next.length - value.length)
      : next.length
    const upto = next.slice(0, caret)
    const m = /(?:^|\s)@([^\s@]*)$/.exec(upto)
    setMentionQuery(m ? m[1] : null)
  }

  const applyMention = (name: string) => {
    const el = ref.current
    const caret = el ? el.selectionStart : value.length
    const upto = value.slice(0, caret)
    const m = /(?:^|\s)@([^\s@]*)$/.exec(upto)
    if (!m) return
    const tokenStart = caret - m[1].length - 1 // '@' 포함 시작
    const next = value.slice(0, tokenStart) + `@${name} ` + value.slice(caret)
    setValue(next, tokenStart + name.length + 2)
    setMentionQuery(null)
  }

  const suggestions =
    mentionQuery != null && mentionNames
      ? mentionNames
          .filter((n) => n.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 6)
      : []

  const toolBtn =
    'text-fg-muted hover:text-fg hover:bg-surface-muted flex size-7 items-center justify-center rounded-md'

  return (
    <div className="border-border focus-within:border-brand rounded-[10px] border">
      {/* 탭 + 툴바 */}
      <div className="border-border flex items-center justify-between border-b px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={cn(
              'rounded-md px-2.5 py-1 text-[12px] font-semibold',
              tab === 'write'
                ? 'bg-surface-muted text-fg'
                : 'text-fg-subtle hover:text-fg',
            )}
          >
            작성
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={cn(
              'rounded-md px-2.5 py-1 text-[12px] font-semibold',
              tab === 'preview'
                ? 'bg-surface-muted text-fg'
                : 'text-fg-subtle hover:text-fg',
            )}
          >
            미리보기
          </button>
        </div>
        {tab === 'write' && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className={toolBtn}
              title="굵게"
              onClick={() => wrap('**', '**', '굵게')}
            >
              <Bold className="size-3.5" />
            </button>
            <button
              type="button"
              className={toolBtn}
              title="코드 블록"
              onClick={() => wrap('\n```\n', '\n```\n', 'code')}
            >
              <Code className="size-3.5" />
            </button>
            <button
              type="button"
              className={toolBtn}
              title="링크"
              onClick={() => wrap('[', '](https://)', '링크')}
            >
              <Link2 className="size-3.5" />
            </button>
            <label className={cn(toolBtn, 'cursor-pointer')} title="이미지">
              <ImageIcon className="size-3.5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) addImageFile(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        )}
      </div>

      {/* 본문 */}
      {tab === 'write' ? (
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            maxLength={maxLength}
            onChange={(e) => handleChange(e.target.value)}
            onPaste={onPaste}
            onDrop={onDrop}
            onBlur={() => setTimeout(() => setMentionQuery(null), 120)}
            placeholder={placeholder}
            style={{ height: minHeight }}
            className="text-fg placeholder:text-fg-subtle block w-full resize-none rounded-b-[10px] bg-transparent px-4 py-3 text-[14px] leading-6 focus:outline-none focus-visible:shadow-none"
          />
          {suggestions.length > 0 && (
            <ul className="border-border absolute bottom-2 left-3 z-20 w-52 overflow-hidden rounded-lg border bg-white shadow-[0px_8px_24px_0px_rgba(18,23,38,0.16)]">
              {suggestions.map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applyMention(n)
                    }}
                    className="hover:bg-surface-muted text-fg flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]"
                  >
                    <span className="text-brand font-bold">@</span>
                    {n}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        // 작성/미리보기 탭 전환 시 높이가 흔들리지 않게 둘 다 같은 고정 높이 + 내부 스크롤.
        <div className="overflow-y-auto px-4 py-3" style={{ height: minHeight }}>
          {value.trim() ? (
            <Markdown mentions={mentionNames}>{value}</Markdown>
          ) : (
            <span className="text-fg-subtle text-[13px]">
              미리볼 내용이 없어요.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
