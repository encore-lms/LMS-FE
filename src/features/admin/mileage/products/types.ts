// 마일리지 상품 관리 (/admin/mileage/products) 도메인 타입 — 기능 로컬.
// BE 계약(P0_16 운영 마일리지, MileageProduct) 확정 전이라 mock 가정 + TODO 주석.

/** 상품 타입 */
export type ProductType = 'COUPON' | 'GOODS' | 'ETC'

/** 가격 방식 — 고정가 / 유연가(수강생 입력) */
export type PriceMode = 'fixed' | 'flexible'

// 상품 한 개(카드).
export interface Product {
  id: string
  /** 대표 이미지(이모지 mock) */
  emoji: string
  type: ProductType
  name: string
  priceMode: PriceMode
  /** 고정가 표시값 — 예: "50,000" (유연가는 null) */
  price: string | null
  order: number
  /** 이번 기수 판매 건수 */
  salesCount: number
  active: boolean
  /** 구매 요청 이력 존재 — 삭제 제한(비활성 전환만 가능) */
  referenced?: boolean
  /** 상품 이미지(blob 경로, 운영 업로드) */
  imageUrl?: string | null
}

// 타입 필터 칩.
export interface TypeCount {
  type: ProductType | 'all'
  label: string
  count: number
}

// 타입별 가격 방식 안내.
export interface TypePricing {
  type: ProductType
  /** 고정가 / 유연가 */
  mode: string
  note: string
}

export interface ProductsData {
  course: string
  cohortLabel: string
  total: number
  typeCounts: TypeCount[]
  products: Product[]
  typePricing: TypePricing[]
}
