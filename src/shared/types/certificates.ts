// 운영 인증 검토(증명서 폐쇄 루프) 도메인 타입. (BE 계약 확정 시 페어가 shared PR로 갱신)

export type CertReviewStatus =
  | 'requested' // 요청됨
  | 'reviewing' // 검토 중
  | 'changes_requested' // 보완 요청
  | 'certified' // 인증 완료

export interface CertReviewListItem {
  id: string
  student: { name: string; studentNo: string; cohort: string }
  status: CertReviewStatus
  requestedAt: string // 표시용 "05-17 14:32"
  assignee: string | null // 담당자(미배정이면 null)
  missingCount: number // 결측
  riskFlags: string[] // 위험 플래그 칩
  latestReason: string // 최근 사유('없음' 가능)
}

// 인증 검토 큐(/admin/certificates/reviews) 응답.
export interface CertReviewQueue {
  total: number // 전체 167
  byStatus: Record<CertReviewStatus, number> // 탭/KPI 카운트
  unassigned: number // 미배정
  riskFlagged: number // 위험 플래그 건
  myAssigned: number // 내 담당
  avgHours: number // 평균 처리 시간
  items: CertReviewListItem[]
}
