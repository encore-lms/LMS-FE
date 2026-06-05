import { cn } from '@/shared/lib/cn'
import type { ScoreBar } from '../types'

// 점수 막대 패널 — 6축 역량 / 퀴즈 카테고리 공통. 막대 색은 점수 임계값 기반(토큰).
function barColor(s: number) {
  if (s >= 85) return 'bg-brand'
  if (s >= 75) return 'bg-info'
  if (s >= 65) return 'bg-warning'
  return 'bg-danger'
}

export function ScoreBarPanel({
  title,
  subtitle,
  bars,
  chipLabel,
  chipTone,
}: {
  title: string
  subtitle: string
  bars: ScoreBar[]
  chipLabel: string
  chipTone: 'info' | 'warning'
}) {
  return (
    <section className="border-border bg-surface flex flex-1 flex-col gap-5 rounded-[14px] border p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-fg text-[17px] font-bold">{title}</h3>
        <p className="text-fg-muted text-[12px]">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-3.5">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-4">
            <span className="text-fg w-20 shrink-0 text-[13px] font-medium">
              {b.label}
            </span>
            <div className="bg-surface-muted h-2.5 flex-1 overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-full', barColor(b.score))}
                style={{ width: `${b.score}%` }}
              />
            </div>
            <span className="text-fg w-9 shrink-0 text-right text-[13px] font-semibold">
              {b.score}
            </span>
          </div>
        ))}
      </div>
      <span
        className={cn(
          'w-fit rounded-full px-3 py-1 text-[12px] font-semibold',
          chipTone === 'info'
            ? 'bg-info-bg text-info'
            : 'bg-warning-bg text-warning',
        )}
      >
        {chipLabel}
      </span>
    </section>
  )
}
