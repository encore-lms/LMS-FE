import { cn } from '@/shared/lib/cn'

export type BadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent'

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-fg-muted',
  info: 'bg-info-bg text-info',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
}

// 공통 상태 배지 — 토큰 기반 pill. 테이블/카드/대시보드 등 상태성 라벨에 재사용.
export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: BadgeTone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE[tone],
      )}
    >
      {label}
    </span>
  )
}
