import { cn } from '@/shared/lib/cn'

// 초록 줄무늬 진행바 — 참고 시안의 시그니처 요소(라임 그린 + 대각 스트라이프).
// 차시 진도율 카드 / 수료 현황에서 공통으로 쓴다. 채움은 success 그린 위 흰 대각선 패턴.
export function OnlineProgressBar({
  pct,
  height = 10,
  className,
}: {
  pct: number
  height?: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div
      className={cn(
        'bg-surface-muted w-full overflow-hidden rounded-full',
        className,
      )}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${clamped}%`,
          backgroundColor: 'var(--color-success)',
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.45) 0 4px, transparent 4px 9px)',
        }}
      />
    </div>
  )
}
