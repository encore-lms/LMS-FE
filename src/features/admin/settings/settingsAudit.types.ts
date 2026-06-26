// 설정 감사 로그 (/admin/settings/audit) 도메인 타입 — 기능 로컬.
// 운영 설정(계정·HRD·과정) 변경의 "불변 로그"를 읽기 전용으로 노출.
// 증명서 감사 로그(admin/audit)와 모델이 다름 — 여기는 origin(출처)/action/target 중심.
// BE 계약(SettingsAuditLog) 확정 전이라 mock 가정 + TODO로 선행.

/** 출처 분류 — 필터 칩(계정 관리/HRD API Key/교육 과정)과 KPI의 기준 */
export type SettingsAuditCategory = 'account' | 'hrd' | 'course'

/** 처리 결과 */
export type SettingsAuditResult = 'success' | 'failure'

// 설정 감사 로그 한 행(불변 이벤트).
export interface SettingsAuditEvent {
  id: string
  /** 발생 시각 — 예: "05-27 09:05" */
  at: string
  /** 작업자 — 운영자명 또는 "시스템" */
  actor: string
  category: SettingsAuditCategory
  /** 출처 표시 — 예: "계정 관리", "HRD API Key", "교육 과정 설정", "교육 과정 추가" */
  origin: string
  /** 작업 — 예: "강사 권한 부여" */
  action: string
  /** 대상 — 예: "이지훈 강사", "prod-key-2026Q2" */
  target: string
  result: SettingsAuditResult
}

// 상단 KPI 5종.
export interface SettingsAuditSummary {
  total: number
  totalHint: string
  accounts: number
  accountsHint: string
  hrdKey: number
  hrdKeyHint: string
  courseConfig: number
  courseConfigHint: string
  security: number
  securityHint: string
}

export interface SettingsAuditData {
  summary: SettingsAuditSummary
  events: SettingsAuditEvent[]
}
