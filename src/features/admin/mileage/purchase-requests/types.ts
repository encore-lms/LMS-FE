// 마일리지 구매 요청 (/admin/mileage/purchase-requests) 도메인 타입 — 기능 로컬.
// BE 계약(P0_16 운영 마일리지, MileageOrder·MileageOrderItem) 확정 전이라 mock 가정 + TODO 주석.

/** 구매 요청 상태 */
export type PurchaseStatus =
  | 'pending' // PENDING — 처리 대기
  | 'approved' // APPROVED — 승인 완료
  | 'revision' // REVISION — 수정 요청
  | 'rejected' // REJECTED — 반려
  | 'canceled' // CANCELED — 수강생 취소

/** 상품 타입 */
export type PurchaseType = 'BOOK' | 'GIFTICON' | 'LECTURE'

// 구매 요청 한 건(표 행).
export interface PurchaseRequest {
  id: string
  status: PurchaseStatus
  type: PurchaseType
  studentName: string
  productName: string
  /** 구매 링크 확인 필요(도서·강의 등) */
  needsLink: boolean
  qty: number
  /** 신청 가격(M) */
  price: number
  date: string
  /** 타입 한도 초과 — 승인 차단 */
  limitExceeded?: boolean
}

// 상단 상태 KPI 한 칸.
export interface StatusKpi {
  status: PurchaseStatus
  /** 영문 라벨 — PENDING / APPROVED ... */
  label: string
  count: number
  note: string
}

// 타입별 처리 안내.
export interface TypeNote {
  type: PurchaseType
  note: string
}

export interface PurchaseData {
  course: string
  cohortLabel: string
  kpis: StatusKpi[]
  requests: PurchaseRequest[]
  typeNotes: TypeNote[]
  total: number
  pendingCount: number
  limitExceededCount: number
}
