// 마일리지 지급 내역 (/admin/mileage/history) 도메인 타입 — 기능 로컬.
// BE 계약(P0_16 운영 마일리지, MileageTransaction) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.

/** 거래 구분 — 지급 / 차감 / 부분 / 실패 */
export type TxType = 'grant' | 'deduct' | 'partial' | 'failed'

/** 수량 부호 — 색 표시용 */
export type AmountSign = 'plus' | 'minus' | 'zero'

// 원장 거래 한 행.
export interface MileageTxRow {
  id: string
  /** 일시 — 예: "05-19 14:32" */
  date: string
  studentName: string
  reason: string
  /** 수량 표기 — 예: "+50,000" / "-50,000" / "+10,000 / 20,000" / "0" */
  amount: string
  amountSign: AmountSign
  txType: TxType
  /** 처리 후 잔액 — 예: "82,500" */
  balance: string
  /** 처리자 — 예: "이매니저" / "시스템" */
  handler: string
  /** 처리 경로 — 예: "직접 지급" / "구매 승인 → 차감" */
  handlerNote: string
  /** 매니저가 아직 승인·반려하지 않은 구매 — 확정 차감과 구분해 보여준다. */
  pending?: boolean
}

// 상단 KPI 4종.
export interface MileageHistorySummary {
  /** 예: "+312,500" */
  granted: string
  grantedHint: string
  deducted: string
  deductedHint: string
  net: string
  netHint: string
  count: number
  countHint: string
}

// 표 하단 요약.
export interface MileageHistoryFooter {
  total: number
  grant: number
  deduct: number
  partial: number
  failed: number
}

export interface MileageHistoryData {
  course: string
  cohortLabel: string
  summary: MileageHistorySummary
  rows: MileageTxRow[]
  footer: MileageHistoryFooter
}
