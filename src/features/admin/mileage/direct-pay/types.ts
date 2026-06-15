// 마일리지 직접 지급 (/admin/mileage/direct-pay) 도메인 타입 — 기능 로컬.
// BE 계약(P0_16 운영 마일리지, MileageAccount·MileageTransaction) 확정 전이라 mock 가정 + TODO 주석.

/** 지급/차감 구분 */
export type PayKind = 'grant' | 'deduct'

// 수강생 한 명(좌측 다중 선택 표).
export interface MileageStudent {
  id: string
  name: string
  uuid: string
  /** 보유 잔액 */
  held: number
  /** 누적 사용 */
  used: number
  /** 누적 적립 */
  accrued: number
  /** 누적 상한 근접 여부 */
  nearLimit?: boolean
}

export interface DirectPayData {
  course: string
  cohortLabel: string
  totalStudents: number
  nearLimitCount: number
  students: MileageStudent[]
}
