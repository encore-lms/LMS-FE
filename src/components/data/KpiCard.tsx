import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export type KpiTone =
  | 'default'
  | 'brand'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

interface KpiCardProps {
  label: string
  value: ReactNode
  /** 값 아래 보조 설명 */
  hint?: string
  /** 값 색 강조 — 상태성 지표(대기·경고 등)에 사용 */
  tone?: KpiTone
  /** 라벨 우측 보조 아이콘 (선택) — 미지정 시 기존과 동일하게 렌더 */
  icon?: ReactNode
}

const TONE_VALUE: Record<KpiTone, string> = {
  default: 'text-fg',
  brand: 'text-brand',
  accent: 'text-accent-strong',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

// 공통 데이터 컴포넌트 — 운영/강사/멘토 대시보드의 핵심 지표 타일.
// 토큰 기반 수동 구현(ADR 0003). 값만 다른 KPI를 한 컴포넌트로 반복 렌더한다.
export function KpiCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: KpiCardProps) {
  return (
    <div className="border-border bg-surface flex flex-col gap-1 rounded-xl border p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-fg-muted text-sm font-medium">{label}</span>
        {icon && <span className="text-fg-subtle shrink-0">{icon}</span>}
      </div>
      <span className={cn('text-3xl font-bold', TONE_VALUE[tone])}>
        {value}
      </span>
      {hint && <span className="text-fg-subtle text-xs">{hint}</span>}
    </div>
  )
}
