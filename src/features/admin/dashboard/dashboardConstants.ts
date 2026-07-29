import { type BadgeTone } from '@/components/ui/StatusBadge'
import type { CohortStatus } from './types'

export const STATUS_META: Record<
  CohortStatus,
  { label: string; tone: BadgeTone }
> = {
  operating: { label: '진행 중', tone: 'success' },
  ended: { label: '수료', tone: 'neutral' },
  upcoming: { label: '개강 전', tone: 'warning' },
}

export const COHORT_COLORS = [
  'var(--color-brand)',
  'var(--color-info)',
  'var(--color-warning)',
  'var(--color-success)',
  'var(--color-accent-strong)',
]

export function cohortColor(index: number) {
  return COHORT_COLORS[index % COHORT_COLORS.length]
}

export const ISSUE_PAGE_SIZE = 5

// 위험도 등급 — 결석 4회↑=긴급, 결석 2회↑ 또는 지각 5회↑=주의(인사이트 기준과 일치).
export type RiskTier = 'danger' | 'warning' | 'neutral'
export function riskTier(lateCount: number, absentCount: number): RiskTier {
  if (absentCount >= 4) return 'danger'
  if (absentCount >= 2 || lateCount >= 5) return 'warning'
  return 'neutral'
}
export const RISK_META: Record<
  RiskTier,
  { badge: string | null; badgeCls: string; bar: string; dot: string }
> = {
  danger: {
    badge: '긴급',
    badgeCls: 'bg-danger-bg text-danger',
    bar: 'bg-danger',
    dot: 'bg-danger',
  },
  warning: {
    badge: '주의',
    badgeCls: 'bg-warning-bg text-warning',
    bar: 'bg-warning',
    dot: 'bg-warning',
  },
  neutral: {
    badge: '관찰',
    badgeCls: 'bg-info-bg text-info',
    bar: 'bg-fg-subtle/40',
    dot: 'bg-fg-subtle/40',
  },
}
