// 운영(admin) 도메인 타입 — 운영 대시보드(v2) 기반. (BE 계약 확정 시 페어가 shared PR로 갱신)

export type OverallStatus = 'normal' | 'caution' | 'danger'

// 대시보드 리스트 행 — 긴급 검토 대상·위험 플래그 많은 대상 공용.
export interface DashboardListItem {
  id: string
  cohort: string // "데이터분석 6기"
  name: string // "김지원"
  detail: string // "인증 요청 · 5일 경과" / "위험 플래그 4건 · 출결 미달"
  isNew?: boolean
}

// 빠른 진입 카드.
export interface QuickEntry {
  key: string
  title: string // "인증 검토 큐"
  meta: string // "대기 8건 · 평균 1.8일"
  to: string // 라우트
  cta: string // "인증 검토로 이동"
}

// 운영 대시보드(v2) 요약 — 전체 상태 배지 + KPI 5 + 긴급/위험 리스트 + 빠른 진입.
// (Figma 운영 Pages "운영 대시보드 v2", 화면_구현_목록 운영 대시보드 P0)
export interface AdminDashboardSummary {
  status: { level: OverallStatus; message: string } // 전체 운영 상태
  martUpdatedAt: string // 마지막 마트 갱신 (ISO)
  kpis: {
    certificationRequests: { value: number; newCount: number; total: number } // 인증 요청
    reviewing: { value: number; avgDays: number } // 검토 중
    changesRequested: { value: number; awaitingStudent: number } // 보완 요청
    certified: { value: number; monthDelta: number } // 인증 완료
    martErrors: { value: number } // 마트 오류
  }
  urgentReviews: DashboardListItem[] // 긴급 검토 대상
  riskFlags: DashboardListItem[] // 위험 플래그 많은 대상
  quickEntry: QuickEntry[] // 빠른 진입
}
