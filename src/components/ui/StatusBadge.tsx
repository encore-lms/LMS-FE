import type { ReactNode } from 'react'
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
// icon(옵셔널)을 주면 라벨 앞에 작은 아이콘이 붙어 상태 구분이 강해진다.
export function StatusBadge({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string
  tone?: BadgeTone
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:h-3 [&>svg]:w-3',
        TONE[tone],
      )}
    >
      {icon}
      {label}
    </span>
  )
}
