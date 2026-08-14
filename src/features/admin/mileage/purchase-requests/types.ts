// 마일리지 구매 요청 (/admin/mileage/purchase-requests) 도메인 타입 — 기능 로컬.
// BE 계약(P0_16 운영 마일리지, MileageOrder·MileageOrderItem) 확정 전이라 mock 가정 + TODO 주석.

/** 구매 요청 상태 */
export type PurchaseStatus =
  | 'pending' // PENDING — 처리 대기
  | 'approved' // APPROVED — 승인 완료
  | 'revision' // REVISION — 수정 요청
  | 'rejected' // REJECTED — 반려
  | 'canceled' // CANCELED — 수강생 취소

/**
 * 구매 요청 처리 액션(전송용) — 표시용 상태(PurchaseStatus)와 값이 다르다.
 *
 * 예전에는 목표 상태를 그대로 실어 보내 상태와 액션이 한 타입을 공유했다. BE 정본은
 * 명령형 snake 토큰이라 여기서 갈라 둔다. 요청 body 키도 action 으로 맞췄다(다른 검토 화면과 동일).
 */
export type PurchaseProcessAction = 'approve' | 'request_changes' | 'reject'

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
  /** 수강생이 제출한 구매 링크(도서·강의). 기프티콘은 null. */
  link?: string | null
  qty: number
  /** 신청 가격(M) */
  price: number
  date: string
  /** 타입 한도 초과 — 승인 차단 */
  limitExceeded?: boolean
  /** 수강생이 요청·재요청하며 남긴 메모. 재요청 건에서 무엇이 바뀌었는지 알려준다. */
  studentNote?: string | null
  /** 매니저가 앞서 남긴 수정 요청·반려 사유. */
  reviewNote?: string | null
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
