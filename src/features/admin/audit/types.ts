// 감사 로그 (/admin/certificates/:certificateId/audit) 도메인 타입 — 기능 로컬.
// 증명서 인증·보완·공개·마트·보안 이벤트의 "불변 로그"를 읽기 전용으로 노출.
// BE 계약(CertificateAuditLog) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.

/** 이벤트 분류 — 필터 칩(인증/보완/공개)과 KPI 집계의 기준 */
export type AuditCategory =
  | 'auth' // 인증 — 정식 인증 승인/반려 등
  | 'supplement' // 보완 — 보완 요청/해제
  | 'public' // 공개 — 공개 URL 토글/복사
  | 'mart' // 마트 — StudentCertificateCandidateMart 재계산
  | 'export' // 내보내기 — PDF/JSON 다운로드
  | 'security' // 보안 — 권한 확인/보안 요청

/** 처리 결과 — 성공 / 실패 / 경고 */
export type AuditResult = 'success' | 'failure' | 'warning'

// 감사 로그 한 행(불변 이벤트).
export interface AuditEvent {
  id: string
  /** 발생 시각 — 예: "05-19 09:32" */
  at: string
  /** 작업자 — 운영자명 또는 "시스템" */
  actor: string
  /** 이벤트명 — 예: "정식 인증 승인" */
  event: string
  category: AuditCategory
  /** 대상 — certificateId·엔티티·파일명 등 (예: "CERT-1842") */
  target: string
  result: AuditResult
  /** 결과 표시 라벨 — 예: "성공" */
  resultLabel: string
  /** 근거 — 출처 화면/작업 ID (예: "승인 모달", "작업 #MJ-43") */
  basis: string
}

// 상단 KPI 5종.
export interface AuditSummary {
  total: number
  totalHint: string
  reviewActions: number
  reviewHint: string
  publicChanges: number
  publicHint: string
  martJobs: number
  martHint: string
  securityEvents: number
  securityHint: string
}

export interface AuditLogData {
  /** 대상 증명서 — KPI/부제에 노출 (예: "CERT-1842") */
  certificateId: string
  summary: AuditSummary
  events: AuditEvent[]
}
