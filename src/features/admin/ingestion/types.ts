// 인입 격리 큐 (/admin/ingestion/quarantine) 도메인 타입 — 기능 로컬.
// BE 계약(P0_20 운영 CSV 매핑·인입·격리 큐) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.

/** 세션 상태 — 진행 중 / 실패 있음 / 성공 / 폐기됨 */
export type SessionStatus =
  | 'in_progress'
  | 'has_failure'
  | 'success'
  | 'discarded'

// 인입 세션 한 건(좌측 표 행).
export interface IngestionSession {
  id: string
  /** 일시 — 예: "05-19 09:42" */
  at: string
  /** 인입 도메인 — 예: "학생 명단 (과거)" */
  domain: string
  successRows: number
  failedRows: number
  status: SessionStatus
}

// 세션 상세 — 카테고리별 실패 사유.
export interface FailureCategory {
  id: string
  /** 사유 — 예: "중복 UUID" */
  reason: string
  count: number
}

// 세션 상세 — 실패 행(행 단위).
export interface FailureRow {
  id: string
  /** 원본 행 번호 */
  lineNo: number
  reason: string
  /** 행 상세 — 예: "studentUuid abc-1234 (4행과 중복)" */
  detail: string
}

// 우측 세션 상세 패널.
export interface SessionDetail {
  sessionId: string
  status: SessionStatus
  /** 요약 줄 — 예: "05-19 09:42 · 학생 명단 (과거) · 1,255행 중 8건 실패" */
  summaryLine: string
  categories: FailureCategory[]
  rows: FailureRow[]
}

// 상단 KPI 4종.
export interface IngestionSummary {
  totalSessions: number
  /** 최근 N일 등 보조 설명 */
  totalSessionsHint: string
  successRows: number
  /** 예: "총 인입의 96.4%" */
  successRowsHint: string
  quarantinedRows: number
  inProgress: number
  /** 예: "AI 캠프 22기 학생 명단" */
  inProgressHint: string
}

export interface IngestionOverview {
  summary: IngestionSummary
  sessions: IngestionSession[]
  /** 세션 id → 상세 */
  details: Record<string, SessionDetail>
}
