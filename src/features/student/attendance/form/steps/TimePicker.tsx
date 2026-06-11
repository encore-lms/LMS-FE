import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'

// 오전·오후 / 시 / 분 객관식 스크롤 피커 — 트리거 클릭 → 세 컬럼에서 클릭 선택.
// 화면은 12시간제(오전/오후 + 1~12시)로 보여주고, 저장값은 24시간 "HH:MM"로 유지한다.
const HOURS12 = Array.from({ length: 12 }, (_, i) => i + 1) // 1~12
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const ITEM_H = 36 // 옵션 한 줄 높이(px) — 열림 시 선택값 가운데 스크롤 계산용
const pad = (n: number) => String(n).padStart(2, '0')

type Period = 'AM' | 'PM'

export function TimePicker({
  value,
  onChange,
  placeholder = '시간 선택',
  invalid,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const hourColRef = useRef<HTMLDivElement>(null)
  const minColRef = useRef<HTMLDivElement>(null)

  // 저장값(24h "HH:MM") → 12시간제 표시 파생
  const has = /^\d{1,2}:\d{2}$/.test(value)
  const [hStr, mStr] = has ? value.split(':') : ['', '']
  const h24 = has ? Number(hStr) : null
  const minute = mStr // '' 또는 '00'~'59'
  const period: Period | '' = h24 === null ? '' : h24 < 12 ? 'AM' : 'PM'
  const hour12 = h24 === null ? null : h24 % 12 || 12

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // 열릴 때 선택값을 시/분 컬럼 가운데로 스크롤(컬럼 내부만, 페이지 영향 없음)
  useEffect(() => {
    if (!open) return
    const center = (col: HTMLDivElement | null, idx: number) => {
      if (col && idx >= 0) {
        col.scrollTop = idx * ITEM_H - col.clientHeight / 2 + ITEM_H / 2
      }
    }
    center(hourColRef.current, hour12 === null ? -1 : hour12 - 1)
    center(minColRef.current, minute === '' ? -1 : Number(minute))
  }, [open, hour12, minute])

  // (오전/오후, 12시, 분) → 24h "HH:MM" 저장
  const commit = (p: Period, hh12: number, mm: string) => {
    let h = hh12 % 12 // 12 → 0
    if (p === 'PM') h += 12
    onChange(`${pad(h)}:${mm}`)
  }
  const pickPeriod = (p: Period) => commit(p, hour12 ?? 12, minute || '00')
  const pickHour = (hh12: number) =>
    commit(period || 'AM', hh12, minute || '00')
  const pickMin = (mm: string) => commit(period || 'AM', hour12 ?? 12, mm)

  const itemClass = (active: boolean) =>
    cn(
      'flex h-9 w-full items-center justify-center rounded-lg text-[14px]',
      active
        ? 'bg-brand/10 text-brand font-bold'
        : 'text-fg-muted hover:bg-surface-muted',
    )
  const colHead =
    'text-fg-subtle border-border border-b py-1.5 text-center text-[11px] font-bold'

  const display =
    has && hour12 !== null
      ? `${period === 'AM' ? '오전' : '오후'} ${pad(hour12)}:${minute}`
      : ''

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-[52px] w-full items-center justify-between rounded-[10px] border-2 bg-white px-4 text-[15px] font-medium outline-none',
          invalid ? 'border-danger' : open ? 'border-brand' : 'border-border',
        )}
      >
        <span className={display ? 'text-fg' : 'text-fg-subtle'}>
          {display || placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          className="text-fg-subtle size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="border-border absolute left-0 z-30 mt-1 flex w-full min-w-[240px] overflow-hidden rounded-xl border bg-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.16)]">
          {/* 오전/오후 */}
          <div className="flex w-1/3 flex-col">
            <div className={colHead}>오전·오후</div>
            <div className="flex h-[180px] flex-col gap-1 p-1">
              {(['AM', 'PM'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => pickPeriod(p)}
                  className={itemClass(period === p)}
                >
                  {p === 'AM' ? '오전' : '오후'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-divider w-px" />

          {/* 시 */}
          <div className="flex w-1/3 flex-col">
            <div className={colHead}>시</div>
            <div ref={hourColRef} className="h-[180px] overflow-y-auto p-1">
              {HOURS12.map((hh) => (
                <button
                  key={hh}
                  type="button"
                  onClick={() => pickHour(hh)}
                  className={itemClass(hour12 === hh)}
                >
                  {pad(hh)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-divider w-px" />

          {/* 분 */}
          <div className="flex w-1/3 flex-col">
            <div className={colHead}>분</div>
            <div ref={minColRef} className="h-[180px] overflow-y-auto p-1">
              {MINUTES.map((mm) => (
                <button
                  key={mm}
                  type="button"
                  onClick={() => pickMin(mm)}
                  className={itemClass(minute === mm)}
                >
                  {mm}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
