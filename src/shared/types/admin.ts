// 운영(admin) 도메인 타입 — 검토 큐·마트 기반. (BE 계약 확정 시 페어가 shared PR로 갱신)

export type MartState = 'fresh' | 'stale' | 'recalculating'

export interface MartStatus {
  state: MartState
  updatedAt: string // ISO
}

// 운영 대시보드 요약 — 인증 요청·검토 대기·보완 요청·마트 갱신 상태
// (화면_구현_목록 운영 콘솔 §운영 대시보드, CertificateReviewQueue·MartJobStatus)
export interface AdminDashboardSummary {
  certificationRequests: number // 인증 요청
  reviewPending: number // 검토 대기
  changesRequested: number // 보완 요청
  mart: MartStatus // 마트 갱신 상태
}
