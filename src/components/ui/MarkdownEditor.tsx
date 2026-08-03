import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Bold, Code, Image as ImageIcon, Link2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Markdown } from './Markdown'
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
  /** 입력창의 스크린리더 이름 — 폼에 라벨이 따로 없을 때 준다. */
  ariaLabel?: string
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
  ariaLabel,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const ref = useRef<HTMLTextAreaElement>(null)
  // insertAtCursor 후 복원할 캐럿 위치(렌더 후 적용).
  const pendingCaret = useRef<number | null>(null)
  // 멘션 자동완성 상태 — 활성 토큰 시작 위치 + 후보.
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  // 제안 리스트 키보드 포커스(↑↓ 이동·Enter/Tab 선택) — 쿼리가 바뀌면 첫 항목으로.
  const [activeIdx, setActiveIdx] = useState(0)
  useEffect(() => {
    setActiveIdx(0)
  }, [mentionQuery])
  // 하이라이트 백드롭 스크롤 동기화용.
  const backdropRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (pendingCaret.current != null && ref.current) {
      const pos = pendingCaret.current
      ref.current.focus()
      ref.current.setSelectionRange(pos, pos)
      pendingCaret.current = null
    }
  })

  // 본문 → 멘션 이름 파싱(전달된 명단 중 @이름 으로 등장한 것).
  // 직전 발행값과 같으면 콜백을 생략한다 — 부모가 mentionNames를 렌더마다 새 배열로 주면
  // (파싱 결과가 같아도) setState 새 배열 → 리렌더 → effect 재실행의 무한 루프가 되고,
  // 이 루프가 라우터 전환(transition)을 굶겨 사이드바 내비가 멈춘다(2026-07-29 운영 QnA 상세).
  const lastEmittedMentions = useRef<string | null>(null)
  useEffect(() => {
    if (!onMentionsChange) return
    const hit =
      !mentionNames || mentionNames.length === 0
        ? []
        : mentionNames.filter((n) => value.includes(`@${n}`))
    const key = hit.join('\n')
    if (lastEmittedMentions.current === key) return
    lastEmittedMentions.current = key
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

  // 입력 변화 시 @멘션 토큰 감지(커서 직전 @비공백 연속) + 슬래시 토큰 감지.
  const handleChange = (next: string) => {
    setValue(next)
    const el = ref.current
    const caret = el
      ? el.selectionStart + (next.length - value.length)
      : next.length
    const upto = next.slice(0, caret)
    if (!mentionNames || mentionNames.length === 0) return
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

  // 제안 리스트가 떠 있는 동안의 키보드 조작 — ↑↓ 이동, Enter/Tab 선택, Esc 닫기.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      applyMention(suggestions[Math.min(activeIdx, suggestions.length - 1)])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setMentionQuery(null)
    }
  }

  // 입력창 멘션 하이라이트 — textarea 글자는 투명(캐럿만 보임)하게 두고, 뒤의 백드롭이
  // 같은 타이포그래피로 전체 텍스트를 그리면서 @이름 토큰만 액센트 칩으로 표시한다.
  const highlightable = !!mentionNames && mentionNames.length > 0
  const renderHighlighted = (): ReactNode[] => {
    const names = [...(mentionNames ?? [])].sort((a, b) => b.length - a.length)
    const out: ReactNode[] = []
    let plain = ''
    let i = 0
    const flush = () => {
      if (plain) {
        out.push(plain)
        plain = ''
      }
    }
    while (i < value.length) {
      if (value[i] === '@') {
        const name = names.find((n) => value.startsWith(n, i + 1))
        if (name) {
          flush()
          out.push(
            <span
              key={`m-${i}`}
              data-testid="mention-highlight"
              className="bg-accent-bg text-accent-strong rounded-[4px]"
            >
              @{name}
            </span>,
          )
          i += name.length + 1
          continue
        }
      }
      plain += value[i]
      i += 1
    }
    flush()
    // 말미 개행이 접히지 않게 zero-width 문자로 마지막 줄을 유지한다.
    out.push('​')
    return out
  }

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
              'h-7 rounded-md px-2.5 text-[12px] font-semibold',
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
              'h-7 rounded-md px-2.5 text-[12px] font-semibold',
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
          {/* 멘션 하이라이트 백드롭 — textarea와 동일 박스/타이포, 스크롤 동기화 */}
          {highlightable && (
            <div
              ref={backdropRef}
              aria-hidden
              className="text-fg pointer-events-none absolute inset-0 overflow-hidden rounded-b-[10px] px-4 py-3 text-[14px] leading-6 break-words whitespace-pre-wrap"
              style={{ height: minHeight }}
            >
              {renderHighlighted()}
            </div>
          )}
          <textarea
            ref={ref}
            value={value}
            maxLength={maxLength}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onDrop={onDrop}
            onScroll={(e) => {
              if (backdropRef.current)
                backdropRef.current.scrollTop = e.currentTarget.scrollTop
            }}
            onBlur={() => setTimeout(() => setMentionQuery(null), 120)}
            placeholder={placeholder}
            aria-label={ariaLabel}
            style={{ height: minHeight }}
            className={cn(
              'placeholder:text-fg-subtle relative block w-full resize-none rounded-b-[10px] bg-transparent px-4 py-3 text-[14px] leading-6 focus:outline-none focus-visible:shadow-none',
              // 하이라이트 모드에선 글자는 백드롭이 그린다 — textarea는 캐럿·선택 영역만.
              highlightable ? 'caret-fg text-transparent' : 'text-fg',
            )}
          />
          {suggestions.length > 0 && (
            <ul
              role="listbox"
              aria-label="멘션 대상 선택"
              className="border-border absolute bottom-2 left-3 z-20 w-52 overflow-hidden rounded-lg border bg-white shadow-[0px_8px_24px_0px_rgba(18,23,38,0.16)]"
            >
              {suggestions.map((n, idx) => (
                <li key={n} role="option" aria-selected={idx === activeIdx}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applyMention(n)
                    }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={cn(
                      'text-fg flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]',
                      idx === activeIdx && 'bg-surface-muted',
                    )}
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
        <div
          className="overflow-y-auto px-4 py-3"
          style={{ height: minHeight }}
        >
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
