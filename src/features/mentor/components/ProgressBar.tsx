import { cn } from '@/shared/lib/cn'

// 진행률 바 — 트랙 h8 surface-muted + fill 상태색, 폭 = 인정 ÷ 배정 비율(%)로 환산.
export function ProgressBar({
  value,
  max,
  fillClass,
}: {
  value: number
  max: number
  fillClass: string
}) {
  const percent = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  return (
    <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
      <div
        className={cn('h-full rounded-full', fillClass)}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
