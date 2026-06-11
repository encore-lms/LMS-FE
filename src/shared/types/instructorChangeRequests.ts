// 강사 인증 후 통합 검토 (P0 29 §11~§12 대체) — 변경 제안·재인증. (Figma 2750:2070·2750:2202)
// 구 프로젝트/트러블슈팅 변경 제안 검토 2종(Deprecated)을 한 큐로 통합.

export type CertReviewTargetType = 'project' | 'troubleshooting'

/** 변경 제안 상태 — 요청 대기 / 검토중 */
export type ChangeRequestStatus = 'requested' | 'reviewing'

/** 변경된 내역 1건 — 접힘 카드에서 이전/변경 값 비교 */
export interface ChangeDiffItem {
  id: string
  /** '기술스택: React Query 추가' */
  label: string
  before: string
  after: string
}

export interface InstructorChangeRequestRow {
  id: string
  type: CertReviewTargetType
  /** '추천 영상 큐레이션' */
  target: string
  /** '김민준 PM' */
  requester: string
  status: ChangeRequestStatus
  /** 원 인증 강사 부재 — 매니저 대체 검토 허용 (P0-INS-REV-009) */
  certifierAbsent: boolean
  changes: ChangeDiffItem[]
}

export interface InstructorChangeRequestsData {
  items: InstructorChangeRequestRow[]
}

export interface RecertificationRow {
  id: string
  type: CertReviewTargetType
  target: string
  /** 'PM 김민준' */
  requesterLabel: string
  /** '수정 완료 요청' */
  summary: string
  changes: ChangeDiffItem[]
}

export interface RecertificationsData {
  items: RecertificationRow[]
}
