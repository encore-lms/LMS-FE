import { cn } from '@/shared/lib/cn'
import { card } from './shared'
import type { PlayStat } from './types'

/** 상단 4-KPI 스트립 — Figma PLAY 프레임 공통 상단 영역(타자/코딩/퀴즈/결과 공유). */
export function StatStrip({ stats }: { stats: PlayStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className={cn(card, 'flex flex-col gap-2')}>
          <span className="text-fg-muted text-[12px]">{s.label}</span>
          <span className="text-brand text-[24px] leading-none font-bold">
            {s.value}
          </span>
          <span className="text-fg-subtle text-[11px]">{s.sub}</span>
        </div>
      ))}
    </div>
  )
}
