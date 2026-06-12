/**
 * /verify 상태 화면 공통 톤 팔레트 — 로딩(info)·공개(success)·비공개(warning)·잘못된 링크(danger).
 * Figma raw(#3b82f6·#eef6ff·#cde3ff·#eaf3ff 등)는 @theme 토큰(info/info-bg + 투명도)으로 매핑.
 * 컴포넌트 파일과 분리(react-refresh 규칙: 컴포넌트 파일은 컴포넌트만 export).
 */
export type VerifyTone = 'info' | 'success' | 'warning' | 'danger'

export const VERIFY_TONES: Record<
  VerifyTone,
  { text: string; bg: string; border: string; dot: string }
> = {
  info: {
    text: 'text-info',
    bg: 'bg-info-bg',
    border: 'border-info/25',
    dot: 'bg-info',
  },
  success: {
    text: 'text-success',
    bg: 'bg-success-bg',
    border: 'border-success/25',
    dot: 'bg-success',
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning-bg',
    border: 'border-warning/25',
    dot: 'bg-warning',
  },
  danger: {
    text: 'text-danger',
    bg: 'bg-danger-bg',
    border: 'border-danger/25',
    dot: 'bg-danger',
  },
}
