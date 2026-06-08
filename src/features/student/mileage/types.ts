// 수강생 마일리지 도메인 계약 — 기능 로컬(공유 파일 미오염). Figma 418:1850 외.
// 내 마일리지 · 상품 신청 · 구매 요청 상태 · 사용 내역.

export type Tone =
  | 'brand'
  | 'info'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'success'

export interface Badge {
  label: string
  tone: Tone
}
export interface MileageStat {
  key: string
  label: string
  value: string
  unit: string
  sub: string
  tone: Tone
  barPct?: number // KPI 진행 트랙바(0~100, Figma 418:1850)
  delta?: Badge // 숫자 옆 델타칩(▲ +18K / 대기 1)
}

/** 내 마일리지 */
export interface LedgerEntry {
  id: string
  label: string
  date: string
  amount: string // "+20,000M" | "-32,000M"
  status: Badge // 적립 / 대기 / 사용
  positive: boolean
}
export interface MileageProductMini {
  name: string
  limit: string // "잔여 한도 68,000M"
  tone: Tone
  icon: 'book' | 'video' | 'gift' // 카테고리 아이콘(Figma 418:1850)
  barPct?: number // 잔여 한도 트랙바
}
export interface MileageLimit {
  label: string // "도서"
  used: number
  total: number
  status: Badge // 여유 / 주의 60% 사용
  tone: Tone
}
export interface MileageOverview {
  balance: string // "128,400"
  balanceSub: string
  stats: MileageStat[]
  ledger: LedgerEntry[]
  products: MileageProductMini[]
  limits: MileageLimit[]
}

/** 상품 신청 */
export interface MileageProduct {
  id: string
  name: string
  badges: Badge[]
  priceType: string // "유연가" | "고정가"
  price?: string // "10,000M" (고정가)
  desc: string
  limit: string // "58,000"
  tone: Tone
}
export interface MileageProductsData {
  balance: string
  inProgress: number
  filters: { key: string; label: string; count: number }[]
  products: MileageProduct[]
}

/** 사용 내역 */
export interface HistoryRow {
  date: string
  kind: Badge // 적립 / 사용 / 구매 요청
  content: string
  amount: string
  positive: boolean
  status: Badge // 완료 / 대기 / 반려
  memo: string
}
export interface MileageHistoryData {
  stats: MileageStat[]
  filters: { key: string; label: string; count: number }[]
  rows: HistoryRow[]
  shownLabel: string
}
