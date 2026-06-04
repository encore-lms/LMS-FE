import { useState, type KeyboardEvent } from 'react'
import { cn } from '@/shared/lib/cn'

// 태그 입력 — 칩 표시 + ×삭제 + Enter/blur로 추가. 기술 태그·관심 직무에 사용.
export function TagInput({
  value,
  onChange,
  placeholder = '추가',
  chipClassName,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  chipClassName?: string
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const t = draft.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((tag) => (
        <span
          key={tag}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
            chipClassName ?? 'bg-surface-muted text-fg',
          )}
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`${tag} 삭제`}
            className="text-fg-subtle hover:text-danger leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={`+ ${placeholder}`}
        className="border-border focus:border-brand placeholder:text-fg-subtle min-w-[88px] flex-1 rounded-full border border-dashed px-3 py-1 text-xs outline-none"
      />
    </div>
  )
}
