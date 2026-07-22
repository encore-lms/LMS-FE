import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { TONE_SOLID } from '@/shared/lib/tone'
import { STACK_CATALOG, type Tone } from '../../types'
import { CHIP_ON, STACK_TONE } from '../../wizard/wizardConstants'

/**
 * 기술 카테고리 칩 피커 — 생성 마법사 Step3의 스택 선택 UI를 설정 탭에서 재사용하기 위한 독립 컴포넌트.
 * 선택값(value)과 토글 콜백만 받고, 카탈로그에 없는 커스텀 스택은 자체 상태로 그룹에 덧붙여 보여준다.
 * disabled면 읽기 전용(칩 표시만, 토글·추가 불가).
 */
export function StackPicker({
  value,
  onToggle,
  disabled,
}: {
  value: string[]
  onToggle: (v: string) => void
  disabled?: boolean
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [input, setInput] = useState('')
  // 카탈로그에 없는 선택값(커스텀)을 그룹별로 붙여 보여주기 위한 로컬 목록.
  const [customByGroup, setCustomByGroup] = useState<Record<string, string[]>>(
    {},
  )

  const toneFor = (s: string): Tone => STACK_TONE.get(s) ?? 'brand'

  const add = () => {
    const v = input.trim()
    if (v && openGroup) {
      setCustomByGroup((prev) => {
        const cur = prev[openGroup] ?? []
        return cur.includes(v) ? prev : { ...prev, [openGroup]: [...cur, v] }
      })
      if (!value.includes(v)) onToggle(v)
    }
    setInput('')
    setOpenGroup(null)
  }

  // 선택됐지만 카탈로그·커스텀 어디에도 없는 값(서버에서 온 기존 커스텀 스택)을 첫 그룹에 노출.
  const known = new Set(
    STACK_CATALOG.flatMap((g) => [...g.items, ...(customByGroup[g.label] ?? [])]),
  )
  const orphanCustoms = value.filter((s) => !known.has(s))

  return (
    <div className="flex flex-col gap-4">
      {value.length > 0 && (
        <div className="bg-surface-muted/50 flex flex-wrap gap-1.5 rounded-xl p-3">
          {value.map((s) => (
            <span
              key={s}
              className={cn(
                'flex items-center gap-1.5 rounded-full py-1 pl-3 text-[12px] font-bold text-white',
                disabled ? 'pr-3' : 'pr-1.5',
                TONE_SOLID[toneFor(s)],
              )}
            >
              {s}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onToggle(s)}
                  aria-label={`${s} 제거`}
                  className="flex size-[18px] items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/40"
                >
                  <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {!disabled &&
        STACK_CATALOG.map((g, gi) => (
          <div key={g.label} className="flex flex-col gap-2">
            <span className="text-fg-muted flex items-center gap-1.5 text-[12px] font-semibold">
              <span className={cn('size-2 rounded-full', TONE_SOLID[g.tone])} />
              {g.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                ...g.items,
                ...(customByGroup[g.label] ?? []),
                ...(gi === 0 ? orphanCustoms : []),
              ].map((it) => {
                const on = value.includes(it)
                return (
                  <button
                    key={it}
                    type="button"
                    onClick={() => onToggle(it)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[12px] font-semibold',
                      on
                        ? CHIP_ON[g.tone]
                        : 'border-border text-fg-muted hover:border-brand/50',
                    )}
                  >
                    {on && '✓ '}
                    {it}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  setOpenGroup(g.label)
                  setInput('')
                }}
                className="border-border text-fg-subtle hover:border-brand/50 rounded-full border border-dashed px-3 py-1.5 text-[12px]"
              >
                + 직접 추가
              </button>
              {openGroup === g.label && (
                <span className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={input}
                    maxLength={30}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        add()
                      } else if (e.key === 'Escape') {
                        setOpenGroup(null)
                        setInput('')
                      }
                    }}
                    placeholder="스택 이름"
                    aria-label={`${g.label} 스택 직접 입력`}
                    className="border-brand w-32 rounded-full border px-3 py-1.5 text-[12px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={add}
                    disabled={!input.trim()}
                    className="bg-brand rounded-full px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
                  >
                    추가
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
    </div>
  )
}
