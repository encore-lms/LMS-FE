// 색조(Tone) SSOT — 역할·기능마다 재선언되던 6-tone union과 톤→클래스 맵의 정본.
// 값은 기존 코드의 다수파 클러스터를 그대로 승격한 것(2026-07-10 감사: SOLID 20곳·SOFT 12곳·TEXT 5곳 동일).
// raw hex 금지 — 모두 @theme 토큰 클래스만 사용한다.
//
// 여기 값과 다른 변종(예: dashboard의 neutral 포함 맵, qna의 bg-danger/10)은 의도된
// 화면별 차이일 수 있어 각 기능에 남긴다 — 통일하려면 Figma 정본 대조 후 별도 결정.

export type Tone =
  | 'brand'
  | 'info'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'success'

/** 연배경 + 텍스트 — 칩/배지/통계 셀. */
export const TONE_SOFT: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}

/** 솔리드 배경 — 점(dot)·막대(bar)·도넛 등. */
export const TONE_SOLID: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}

/** 텍스트 색만. */
export const TONE_TEXT: Record<Tone, string> = {
  brand: 'text-brand',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent-strong',
  success: 'text-success',
}
