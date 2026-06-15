// 외부 연동 (/admin/integrations) 도메인 타입 — 기능 로컬.
// BE 계약(P0_23 운영 외부 연동 관리) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.

/** 연동 상태 — 정상 / 주의 / 오류 / 비활성 */
export type IntegrationStatus = 'normal' | 'warning' | 'error' | 'inactive'

// 외부 연동 한 건(표 행).
export interface Integration {
  id: string
  /** 연동명 — Notion / GitHub / Google Drive / 행정 시스템 / Slack 알림 */
  name: string
  purpose: string
  lastSync: string
  status: IntegrationStatus
  /** 상태 표시 라벨 — 예: "정상" / "Webhook 오류" / "주의" / "비활성" */
  statusLabel: string
  owner: string
  /** 액션 라벨 — 수동 동기화 / 재연결 / 상세 / 권한 확인 / 설정 */
  actionLabel: string
}

/** 작업 상태 — 완료 / 실패 / 진행 중 / 대기 */
export type JobStatus = 'done' | 'failed' | 'running' | 'pending'

// SyncJob 한 건(하단 표).
export interface SyncJob {
  id: string
  name: string
  target: string
  status: JobStatus
  /** 다음 실행 — 예: "15분 후" / "수동" / "-" / "02:00" */
  nextRun: string
}

// 상단 KPI 5종.
export interface IntegrationsSummary {
  normal: number
  normalHint: string
  warning: number
  warningHint: string
  error: number
  errorHint: string
  pendingJobs: number
  pendingHint: string
  /** 실패율 — 예: "2.1%" */
  failureRate: string
  failureHint: string
}

export interface IntegrationsData {
  summary: IntegrationsSummary
  integrations: Integration[]
  jobs: SyncJob[]
}
