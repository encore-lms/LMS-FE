import { cn } from '@/shared/lib/cn'
import type { ProjectStat, Tone } from '../types'

// 프로젝트 목록 상단 통계 4종 — 참여/인증완료/검토중/작성중.
const ICON: Record<Tone, { ch: string; cls: string }> = {
  brand: { ch: '📋', cls: 'bg-brand/10 text-brand' },
  success: { ch: '✓', cls: 'bg-success-bg text-success' },
  warning: { ch: '⏳', cls: 'bg-warning-bg text-warning' },
  accent: { ch: '✎', cls: 'bg-accent-bg text-accent-strong' },
  info: { ch: 'ℹ', cls: 'bg-info-bg text-info' },
  danger: { ch: '!', cls: 'bg-danger-bg text-danger' },
}

export function ProjectStatCards({ stats }: { stats: ProjectStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.key}
          className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5"
        >
          <div className="flex items-start justify-between">
            <span className="text-fg-muted text-[12px] font-medium">
              {s.label}
            </span>
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-md text-[12px] font-bold',
                ICON[s.tone].cls,
              )}
            >
              {ICON[s.tone].ch}
            </span>
          </div>
          <span className="text-fg text-[28px] leading-none font-bold">
            {s.value}
            <span className="text-fg-muted ml-1 text-[14px] font-medium">
              {s.unit}
            </span>
          </span>
          <span className="text-fg-subtle border-divider border-t pt-2.5 text-[11px]">
            {s.sub}
          </span>
        </div>
      ))}
    </div>
  )
}
