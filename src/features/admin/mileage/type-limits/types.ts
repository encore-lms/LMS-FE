// 마일리지 타입 한도 설정 (/admin/mileage/type-limits) 도메인 타입 — 기능 로컬.
// BE 계약(P0_16 운영 마일리지, MileageProductTypeLimit) 확정 전이라 mock 가정 + TODO 주석.

/** 한도 타입 */
export type LimitType = 'GIFTICON' | 'BOOK' | 'LECTURE'

// 타입별 한도 카드.
export interface TypeLimit {
  type: LimitType
  /** 한글 라벨 — 기프티콘 / 도서 / 온라인 강의 */
  label: string
  description: string
  /** 등록 상품 수 */
  productCount: number
  /** 가격 방식 — 고정가 / 유연가 */
  priceMode: string
  /** 구매 입력 — 수량 / 링크·가격 */
  purchaseInput: string
  /** 현재 maxPerUser(M) */
  current: number
  /** 기본값(M) */
  defaultValue: number
}

export interface TypeLimitsData {
  course: string
  cohortLabel: string
  limits: TypeLimit[]
}
