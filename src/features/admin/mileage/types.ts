// 마일리지 관리 (/admin/mileage) 허브 도메인 타입 — 기능 로컬.
// BE 계약(P0_16 운영 마일리지 관리) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.
// 본 화면은 13장 클러스터의 진입 허브 — 5개 콘텐츠 탭(지급 내역·직접 지급·구매 요청·상품 관리·타입 한도)으로 분기한다.

// 히어로 — 과정/기수 + 발행·사용·잔액.
export interface MileageHero {
  course: string
  /** 예: "22기 · 121명" */
  cohortLabel: string
  issued: number
  used: number
  /** 예: "39.7%" */
  usedRate: string
  balance: number
  studentCount: number
}

export type MileageAlertTone = 'warning' | 'danger' | 'info' | 'neutral'

// 경보 카드.
export interface MileageAlert {
  id: string
  /** 예: "한도 초과" */
  label: string
  /** 예: "3건" */
  count: string
  /** 예: "타입 한도 초과 — 처리 보류" */
  note: string
  tone: MileageAlertTone
}

// 탭 카드 통계 칩.
export interface MileageTabStat {
  label: string
  value: string
  /** 지급·활성 등 긍정 지표 강조 */
  positive?: boolean
}

// 콘텐츠 탭 카드(클러스터 진입).
export interface MileageTabCard {
  id: string
  title: string
  /** 연관 모델 — 예: "MileageTransaction · MileageAccount" */
  model: string
  description: string
  stats: MileageTabStat[]
  /** CTA 라벨 — 예: "지급 내역 보기" */
  cta: string
  /** 진입 라우트 */
  route: string
  /** 진입 화면 구현 완료 여부 — true면 CTA가 navigate, 아니면 준비 중 토스트 */
  ready?: boolean
}

export interface MileageOverview {
  hero: MileageHero
  alerts: MileageAlert[]
  tabs: MileageTabCard[]
}
