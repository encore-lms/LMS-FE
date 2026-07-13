import { cn } from '@/shared/lib/cn'
import { StatTileCard } from '@/components/data/StatTileCard'
import type { RecordStat } from '../types'
import { TONE_SOLID } from '@/shared/lib/tone'

// 기록실 요약 통계 4종 — 전체 기록 / 승인 완료 / 검토 중 / 반려.

export function RecordStatCards({ stats }: { stats: RecordStat[] }) {
  // 첫 카드(전체 기록)를 100% 기준으로 각 카드의 비율 막대를 채운다.
  const total = parseInt(stats[0]?.value ?? '1', 10) || 1
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => {
        const fill = Math.min(1, (parseInt(s.value, 10) || 0) / total)
        return (
          <StatTileCard
            key={s.key}
            label={s.label}
            value={s.value}
            unit={s.unit}
            sub={s.sub}
            headerAlign="center"
            badge={
              <span
                className={cn('size-2 rounded-full', TONE_SOLID[s.dotTone])}
              />
            }
            bar={
              <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
                <span
                  className={cn(
                    'block h-full rounded-full',
                    TONE_SOLID[s.dotTone],
                  )}
                  style={{ width: `${fill * 100}%` }}
                />
              </div>
            }
          />
        )
      })}
    </div>
  )
}
