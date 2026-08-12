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
import { Bold, Code, Image as ImageIcon, Link2, Paperclip } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Markdown } from './Markdown'
import { fileTitle } from './embedMeta'
import { uploadEditorFile, type UploadScope } from '@/shared/api'

// BE 가 받아 주는 한도와 같게 둔다 — 넘으면 올려 보내고 나서야 400 을 받는다.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_FILE_BYTES = 20 * 1024 * 1024

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
  /**
   * 테두리 없이 — 글이 이어지는 자리(답변·댓글)에서 상자로 가두지 않는다.
   *
   * <p>탭·툴바는 배경 위에 그대로 얹고 입력칸만 옅은 바탕으로 구분한다.</p>
   */
  flat?: boolean
  /**
   * 올린 파일을 어느 경로로 주고받을지 — 쓰는 사람의 역할.
   *
   * <p>BE 가 경로 앞머리로 역할을 가른다. 수강생이 강사 경로를 부르면 403 이라 화면이
   * 자기 역할을 알려 줘야 한다. 기본값을 두지 않는다 — 한쪽으로 기울여 두면 빠뜨린
   * 화면이 조용히 403 을 받고 첨부만 안 되는 채로 지나간다(운영 QnA 댓글에서 겪었다).</p>
   */
  uploadScope: UploadScope
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
  flat = false,
  uploadScope,
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
  // 올리는 중 표시 — 큰 파일은 시간이 걸려 아무 반응이 없으면 안 된 줄 안다.
  const [uploading, setUploading] = useState(0)
  // 파일을 끌어다 올린 상태(놓을 자리 표시).
  const [dragging, setDragging] = useState(false)

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

  // 업로드는 몇 초가 걸린다. 그 사이 사용자가 더 친 글자가 있으면 클로저가 붙든 옛 본문에
  // 덮어써 방금 친 글이 사라진다 — 삽입은 늘 최신값 위에서 한다.
  const valueRef = useRef(value)
  valueRef.current = value

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
    const cur = valueRef.current
    const el = ref.current
    const at = el ? Math.min(el.selectionStart, cur.length) : cur.length
    const next = cur.slice(0, at) + text + cur.slice(at)
    setValue(next, at + text.length)
  }

  /**
   * 고른 파일을 서버에 올리고 본문에 참조를 넣는다.
   *
   * <p>예전엔 base64 를 브라우저 메모리에만 담아 뒀다. 글은 저장돼도 그림은 새로고침하면
   * 사라져 "첨부가 안 된다"로 보였다. 이제 본문에는 `upload:{id}` 만 남고 읽는 화면이
   * 자기 역할 경로로 받아 온다.</p>
   */
  const addFile = async (file: File) => {
    const image = file.type.startsWith('image/')
    const limit = image ? MAX_IMAGE_BYTES : MAX_FILE_BYTES
    if (file.size > limit) {
      onImageRejected?.(
        `${image ? '이미지' : '파일'}는 ${limit / 1024 / 1024}MB 이하만 첨부할 수 있어요`,
      )
      return
    }
    setUploading((n) => n + 1)
    try {
      const up = await uploadEditorFile(file, uploadScope)
      const name = up.fileName || file.name || '첨부파일'
      // 이미지는 본문에 그대로 그려지고, 그 밖의 파일은 내려받는 카드로 그려진다.
      insert(
        up.image
          ? `\n![${name}](${up.url})\n`
          : `\n[${name}](${up.url} "${fileTitle(up.fileSize)}")\n`,
      )
    } catch (err) {
      // 서버가 이유를 말해 주면 그대로 보여 준다 — "올리지 못했어요"만 뜨면 무엇을 고쳐야
      // 할지 알 수 없다.
      const said = (
        err as { response?: { data?: { message?: string } } } | undefined
      )?.response?.data?.message
      onImageRejected?.(
        typeof said === 'string' && said.trim()
          ? said
          : `${image ? '이미지' : '파일'}를 올리지 못했어요. 잠시 후 다시 시도해 주세요`,
      )
    } finally {
      setUploading((n) => n - 1)
    }
  }

  const addFiles = (files: File[]) => {
    for (const f of files) void addFile(f)
  }

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files)
    if (files.length > 0) {
      e.preventDefault()
      addFiles(files)
    }
  }

  // 끌어다 놓기 — 상자 어디에 놓아도 받는다(예전엔 입력칸 위 이미지 한 장만 받았다).
  const hasFiles = (e: DragEvent<HTMLElement>) =>
    Array.from(e.dataTransfer.types).includes('Files')

  const onDragOver = (e: DragEvent<HTMLElement>) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    setDragging(true)
  }

  const onDragLeave = (e: DragEvent<HTMLElement>) => {
    // 자식으로 옮겨 가는 것도 leave 로 잡혀 표시가 깜빡인다 — 상자 밖으로 나갈 때만 끈다.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    setDragging(false)
  }

  const onDrop = (e: DragEvent<HTMLElement>) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
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
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'relative',
        flat
          ? ''
          : 'border-border focus-within:border-brand rounded-[10px] border',
        dragging && 'border-brand',
      )}
    >
      {/* 탭 + 툴바 */}
      <div
        className={cn(
          'flex items-center justify-between py-1.5',
          flat ? 'px-0' : 'border-border border-b px-2',
        )}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={cn(
              'h-7 rounded-md text-[13px] font-semibold',
              flat ? 'px-0 pr-4' : 'px-2.5',
              tab === 'write'
                ? flat
                  ? 'text-fg'
                  : 'bg-surface-muted text-fg'
                : 'text-fg-subtle hover:text-fg',
            )}
          >
            작성
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={cn(
              'h-7 rounded-md text-[13px] font-semibold',
              flat ? 'px-0' : 'px-2.5',
              tab === 'preview'
                ? flat
                  ? 'text-fg'
                  : 'bg-surface-muted text-fg'
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
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []))
                  e.target.value = ''
                }}
              />
            </label>
            <label className={cn(toolBtn, 'cursor-pointer')} title="파일 첨부">
              <Paperclip className="size-3.5" />
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []))
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        )}
      </div>

      {/* 끌어다 놓는 중 — 어디에 놓아도 된다는 것을 상자 전체로 알린다. */}
      {dragging && (
        <div className="border-brand bg-surface/90 text-brand pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[10px] border-2 border-dashed text-[13px] font-semibold">
          여기에 놓으면 첨부돼요
        </div>
      )}

      {/* 본문 */}
      {tab === 'write' ? (
        <div className={cn('relative', flat && 'bg-surface-muted rounded-xl')}>
          {/* 멘션 하이라이트 백드롭 — textarea와 동일 박스/타이포, 스크롤 동기화 */}
          {highlightable && (
            <div
              ref={backdropRef}
              aria-hidden
              className={cn(
                'text-fg pointer-events-none absolute inset-0 overflow-hidden px-4 py-3 text-[14px] leading-6 break-words whitespace-pre-wrap',
                flat ? 'rounded-xl' : 'rounded-b-[10px]',
              )}
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
            onScroll={(e) => {
              if (backdropRef.current)
                backdropRef.current.scrollTop = e.currentTarget.scrollTop
            }}
            onBlur={() => setTimeout(() => setMentionQuery(null), 120)}
            placeholder={placeholder}
            aria-label={ariaLabel}
            style={{ height: minHeight }}
            className={cn(
              'placeholder:text-fg-subtle relative block w-full resize-none px-4 py-3 text-[14px] leading-6 focus:outline-none focus-visible:shadow-none',
              // 배경은 감싸는 칸이 깔았다 — 여기에 불투명 배경을 주면 글자를 그리는
              // 백드롭이 가려져 타자를 쳐도 아무것도 안 보인다.
              flat ? 'bg-transparent' : 'rounded-b-[10px] bg-transparent',
              // 하이라이트 모드에선 글자는 백드롭이 그린다 — textarea는 캐럿·선택 영역만.
              highlightable ? 'caret-fg text-transparent' : 'text-fg',
            )}
          />
          {uploading > 0 && (
            <div
              role="status"
              className="text-fg-subtle absolute right-3 bottom-2 flex items-center gap-1.5 text-[11px]"
            >
              <span className="border-brand size-3 animate-spin rounded-full border-2 border-t-transparent" />
              올리는 중…
            </div>
          )}
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
