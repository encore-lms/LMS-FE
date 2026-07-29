/** 역량 증명서 진행 상태 — 수강생 화면(§19)의 인증 사이클과 같은 축. */
export type CompetencyCertStatus =
  | 'draft'
  | 'reviewing'
  | 'changes_requested'
  | 'certified'

/** 목록 한 줄 — 수강생 한 명의 역량 증명서 현황. */
export interface CompetencyCertRow {
  studentId: string
  studentName: string
  studentUuid: string
  cohortLabel: string
  status: CompetencyCertStatus
  /** 외부 공개 여부 — 인증 완료 건에서만 켤 수 있다. */
  published: boolean
  overallScore: number
  profileLabel: string
  updatedAt: string
}
