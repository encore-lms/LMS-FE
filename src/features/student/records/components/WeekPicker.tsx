import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { WeekCell } from '../types'

// 주차 선택 그리드 — 블로그 등록/수정 폼 공용. 승인/반려/완료 상태 + 선택 강조.
const LEGEND: { label: string; cls: string }[] = [
  { label: '공주', cls: 'bg-success' },
  { label: '승인', cls: 'bg-brand' },
  { label: '반려', cls: 'bg-danger' },
]

// 접힌 상태에서 먼저 보여줄 주차 수 — 그 이상은 "더보기"로 펼친다.
const INITIAL_VISIBLE = 8

export function WeekPicker({
  cohortLabel,
  weeks,
  moreLabel,
  selectedNo,
  onSelect,
  selectedPill,
  locked = false,
}: {
  cohortLabel: string
  weeks: WeekCell[]
  moreLabel: string
  selectedNo: number
  onSelect: (no: number) => void
  selectedPill: string
  /** 수정 모드 — 주차는 기존 1개로 고정(다른 주차 선택 불가, 더보기 숨김) */
  locked?: boolean
}) {
  const [showAll, setShowAll] = useState(false)

  // 잠금 시엔 선택된 주차만 노출. 평소엔 접힘/펼침에 따라 일부/전체.
  const visibleWeeks = locked
    ? weeks.filter((w) => w.no === selectedNo)
    : showAll
      ? weeks
      : weeks.slice(0, INITIAL_VISIBLE)
  const hiddenCount = weeks.length - visibleWeeks.length
  const canExpand = !locked && !showAll && hiddenCount > 0

  return (
    <section className="border-border bg-surface relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-6">
      <span className="bg-brand absolute top-0 left-0 h-full w-1" />
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[15px] font-bold">주차 선택</span>
          <span className="text-fg-subtle text-[11px]">
            {locked ? '수정 시 주차는 변경할 수 없습니다' : cohortLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {LEGEND.map((l) => (
            <span
              key={l.label}
              className="text-fg-muted flex items-center gap-1 text-[11px]"
            >
              <span className={cn('size-2 rounded-full', l.cls)} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visibleWeeks.map((w) => {
          const selected = w.no === selectedNo
          const disabled = locked && !selected
          return (
            <button
              key={w.no}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(w.no)}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-[14px] border p-4 text-center transition-colors',
                cellCls(w, selected),
                disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              {selected && (
                <span className="bg-brand absolute top-2 right-2 flex size-4 items-center justify-center rounded-full text-[9px] text-white">
                  ✓
                </span>
              )}
              <span className="text-[14px] font-bold">{w.label}</span>
              <span className="text-[11px] opacity-80">{w.range}</span>
              {w.note && (
                <span className="text-[10px] font-semibold opacity-90">
                  {w.note}
                </span>
              )}
            </button>
          )
        })}
        {canExpand && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="border-border text-fg-subtle hover:border-brand/50 hover:text-brand flex flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed p-4 text-center transition-colors"
          >
            <span className="text-[13px] font-semibold">더보기</span>
            <span className="text-[11px]">
              {moreLabel.replace('더보기 ', '') || `+${hiddenCount}개`}
            </span>
          </button>
        )}
      </div>

      <span className="bg-brand/10 text-brand flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold">
        <span className="bg-brand size-1.5 rounded-full" />
        {selectedPill}
      </span>
    </section>
  )
}

function cellCls(w: WeekCell, selected: boolean) {
  if (selected && w.state === 'rejected')
    return 'border-danger bg-danger-bg text-danger'
  if (selected) return 'border-brand bg-brand text-white'
  switch (w.state) {
    case 'approved':
      return 'border-brand/40 bg-brand/10 text-brand'
    case 'rejected':
      return 'border-danger/40 bg-danger-bg/60 text-danger'
    case 'completed':
      return 'border-border bg-surface-muted text-fg-muted'
    default:
      return 'border-border bg-surface text-fg hover:border-brand/50'
  }
}
