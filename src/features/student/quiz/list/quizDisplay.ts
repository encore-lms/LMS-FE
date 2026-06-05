import type { GradingMode } from '@/shared/types'
import type { QuizCategory } from '../types'

// 퀴즈 목록 표시 매핑 — 카테고리 배지 색·채점 방식 라벨·D-day 톤(토큰만).
export const CATEGORY_BADGE: Record<QuizCategory, string> = {
  BACKEND: 'bg-brand/10 text-brand',
  FRONTEND: 'bg-warning-bg text-warning',
  DEVOPS: 'bg-accent-bg text-accent-strong',
  DATABASE: 'bg-info-bg text-info',
  CS: 'bg-accent-bg text-accent-strong',
}

export const GRADING_LABEL: Record<GradingMode, string> = {
  AUTO: '자동',
  MANUAL: '수동',
  MIXED: '혼합',
}

/** D-day 남은 일수 → 원형 배지 톤(임박할수록 위험) */
export function dDayTone(d: number) {
  if (d <= 1) return 'bg-danger-bg border-danger text-danger'
  if (d <= 3) return 'bg-warning-bg border-warning text-warning'
  return 'bg-surface-muted border-fg-muted text-fg-muted'
}
