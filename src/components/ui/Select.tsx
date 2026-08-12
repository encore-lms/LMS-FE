import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

/** 패널이 화면 가장자리에 붙지 않도록 두는 최소 여백(px). */
const VIEWPORT_GAP = 8

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/**
 * 공용 셀렉트 — 네이티브 <select>의 브라우저 기본 옵션 팝업을 대체하는 커스텀 listbox.
 * (option 목록은 CSS로 스타일링이 불가해 버튼+포털 패널로 구현. 디자인 통일 목적)
 * 시그니처는 네이티브 대체가 쉽도록 value/onChange(string)/options 로 단순화했다.
 * 키보드: Enter·Space·↑↓ 열기 / ↑↓ 이동 / Enter 선택 / Esc 닫기.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = '선택',
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  value: string | null
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  /** 트리거 버튼 추가 클래스(폭 등). 기본 h-9·rounded-lg·text-sm */
  className?: string
  'aria-label'?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [pos, setPos] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)

  const selected = options.find((o) => o.value === value) ?? null

  // 패널 위치 — 트리거 아래 기본, 하단 공간이 모자라면 위로 연다.
  useEffect(() => {
    if (!open) return
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    const estHeight = Math.min(options.length * 36 + 8, 280)
    const below = window.innerHeight - r.bottom
    const openUp = below < estHeight + 12 && r.top > below
    setPos({
      top: openUp ? r.top - estHeight - 6 : r.bottom + 6,
      left: r.left,
      width: r.width,
    })
    setActive(options.findIndex((o) => o.value === value))
  }, [open, options, value])

  /**
   * 가로 넘침 보정.
   *
   * <p>위아래만 보고 좌우는 트리거 왼쪽에 그대로 붙였더니, 화면 오른쪽 끝에 있는 선택기에서
   * 긴 옵션(기수명 등)이 패널을 트리거보다 넓게 만들어 화면 밖으로 나갔다.
   * 실제 폭은 그려 봐야 알 수 있어 그린 뒤 한 번 당긴다.</p>
   */
  useLayoutEffect(() => {
    if (!open || !pos) return
    const el = listRef.current
    if (!el) return
    const maxLeft = window.innerWidth - el.offsetWidth - VIEWPORT_GAP
    const nextLeft = Math.max(VIEWPORT_GAP, Math.min(pos.left, maxLeft))
    if (Math.abs(nextLeft - pos.left) > 0.5) {
      setPos({ ...pos, left: nextLeft })
    }
  }, [open, pos])

  // 외부 클릭·스크롤·리사이즈 시 닫기(포털이라 캡처 단계 스크롤 감지).
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t))
        setOpen(false)
    }
    const onScrollOrResize = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return // 패널 내부 스크롤은 유지
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open])

  const commit = (idx: number) => {
    const o = options[idx]
    if (!o || o.disabled) return
    onChange(o.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, options.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      commit(active)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          'border-border bg-surface text-fg focus-visible:border-brand inline-flex h-9 items-center justify-between gap-2 rounded-lg border px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
      >
        <span className={cn('truncate', !selected && 'text-fg-subtle')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'text-fg-subtle size-4 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open &&
        !disabled &&
        pos &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              top: pos.top,
              left: pos.left,
              minWidth: pos.width,
              maxWidth: `calc(100vw - ${VIEWPORT_GAP * 2}px)`,
            }}
            className="fixed z-[10050] max-h-[280px] overflow-auto rounded-xl bg-white p-1 shadow-[0_4px_20px_rgba(18,23,38,0.14),0_0_0_1px_rgba(18,23,38,0.06)]"
          >
            {options.length === 0 && (
              <li className="text-fg-subtle px-3 py-2 text-[13px]">
                선택할 항목이 없어요
              </li>
            )}
            {options.map((o, i) => {
              const isSel = o.value === value
              return (
                <li key={o.value} role="option" aria-selected={isSel}>
                  <button
                    type="button"
                    disabled={o.disabled}
                    onClick={() => commit(i)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      'text-fg flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] disabled:opacity-50',
                      i === active && 'bg-surface-muted',
                      isSel && 'font-semibold',
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSel && <Check className="text-brand size-4 shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body,
        )}
    </>
  )
}
