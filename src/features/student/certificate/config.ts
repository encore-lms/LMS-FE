// 증명서 v2 토글 — AI 분석 레이어·동료 대비 퍼센타일·관계 시각화(도메인 도넛 등).
// 백엔드 없이 mock 기반 프론트 선반영. 원복: 이 값을 false 로 두면 기존 v1 화면만 렌더된다.
// (v1 코드/데이터는 그대로 보존하고 v2는 전부 이 플래그 뒤에 순수 추가됨)
export const CERT_V2 = true

// 실제 발급 데이터가 없어도 화면 시안을 확인할 수 있는 로컬 개발 전용 진입점이다.
export const CERTIFICATE_DEMO_MODE =
  import.meta.env.DEV && import.meta.env.VITE_CERTIFICATE_DEMO_MODE === 'true'
