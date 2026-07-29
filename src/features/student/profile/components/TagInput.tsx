import { useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/shared/lib/cn'

// 태그 입력 — 칩 표시 + ×삭제. 기본은 [+ 추가] 버튼만, 누르면 입력창이 열리고
// Enter 또는 [추가]로 완료. 입력창 밖 클릭/Esc로 닫힘. 칩 색은 팔레트 순환(@theme 토큰).
const PALETTE = [
  'bg-success-bg text-success',
  'bg-info-bg text-info',
  'bg-accent-bg text-accent-strong',
  'bg-warning-bg text-warning',
  'bg-danger-bg text-danger',
]

export function TagInput({
  value,
  onChange,
  placeholder = '입력 후 Enter',
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const add = () => {
    const t = draft.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
    inputRef.current?.focus()
  }
  const close = () => {
    setDraft('')
    setEditing(false)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((tag, i) => (
        <span
          key={tag}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
            PALETTE[i % PALETTE.length],
          )}
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`${tag} 삭제`}
            className="leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </span>
      ))}

      {editing ? (
        <span
          className="inline-flex items-center gap-1"
          onBlur={(e) => {
            // 입력창+[추가] 버튼 영역 밖으로 포커스가 나가면 닫는다.
            if (!e.currentTarget.contains(e.relatedTarget as Node)) close()
          }}
        >
          <input
            ref={inputRef}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="border-brand placeholder:text-fg-subtle w-[140px] rounded-full border border-dashed px-3 py-1 text-xs outline-none"
          />
          <button
            type="button"
            onClick={add}
            disabled={draft.trim() === ''}
            className="bg-brand inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
          >
            추가
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="border-border text-fg-muted hover:bg-surface-muted inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs font-semibold"
        >
          + 추가
        </button>
      )}
    </div>
  )
}
