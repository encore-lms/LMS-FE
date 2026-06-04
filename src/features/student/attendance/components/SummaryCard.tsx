import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

// 단일 통계 카드 — 라벨(상)·값(중, 크게)·보조(하). 출결 요약 5카드의 한 칸.
export function SummaryCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  /** 강조 카드(출석률)는 값에 brand 색을 준다 */
  accent?: boolean
}) {
  return (
    <div className="border-border bg-surface flex flex-1 flex-col gap-2 rounded-xl border p-5">
      <span className="text-fg-muted text-[13px]">{label}</span>
      <span
        className={cn('text-2xl font-bold', accent ? 'text-brand' : 'text-fg')}
      >
        {value}
      </span>
      {sub && <span className="text-fg-subtle text-xs">{sub}</span>}
    </div>
  )
}
