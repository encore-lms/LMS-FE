import type { Tone } from '../types'

// 대시보드 색조 → @theme 토큰 className 매핑 (raw hex 금지 가드레일 준수).
// SOFT=연배경+텍스트(칩/배지·통계셀), SOLID=솔리드(점·막대), TEXT=텍스트 색만.

export const TONE_SOFT: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-fg-muted',
  brand: 'bg-success-bg text-brand',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  accent: 'bg-accent-bg text-accent-strong',
}

export const TONE_SOLID: Record<Tone, string> = {
  neutral: 'bg-fg-subtle',
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  accent: 'bg-accent-strong',
}

export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-fg-muted',
  brand: 'text-brand',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  accent: 'text-accent-strong',
}
