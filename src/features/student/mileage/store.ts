import { create } from 'zustand'

// 데모용 클라이언트 마일리지 상태. 백엔드 연동 전까지 잔액/구매 요청을 메모리에 들고
// '승인 후 차감' 규칙을 재현한다.
//  - 자동 승인 상품(기프티콘 즉시 발급)은 제출=승인이라 즉시 차감
//  - 검토 필요 상품은 PENDING → 승인 전까지 잔액 보존(차감 없음)
// 새로고침하면 초기값으로 리셋된다(mock 기반 데모라 persist 미적용).

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface MileageRequest {
  id: string
  product: string
  amount: number // 차감(예정) 금액
  status: RequestStatus
  date: string // 'YYYY-MM-DD'
  reason?: string // 반려 사유
  memo?: string
  link?: string
}

// "10,000M" | "10,000" → 10000
export function parseMoney(s: string | null | undefined): number {
  if (!s) return 0
  return Number(s.replace(/[^\d]/g, '')) || 0
}

// mocks.ts mockOverview.balance '128,400' 기준 — 시드 요청은 이 잔액에 이미 반영된 것으로 본다.
const INITIAL_BALANCE = 128400

const SEED_REQUESTS: MileageRequest[] = [
  {
    id: 'MLG-20260513-014',
    product: '도서 구매 신청 — 클린 아키텍처 외 2권',
    amount: 32000,
    status: 'pending',
    date: '2026-05-13',
    memo: '매니저 확인 중',
  },
  {
    id: 'MLG-20260509-009',
    product: '기프티콘 구매 — 스타벅스 아메리카노',
    amount: 10000,
    status: 'approved',
    date: '2026-05-09',
  },
  {
    id: 'MLG-20260506-006',
    product: '온라인 강의 구매 — Spring 마스터',
    amount: 45000,
    status: 'rejected',
    date: '2026-05-06',
    reason: '구매 링크가 접근 불가 상태입니다. 공개 링크로 다시 제출해 주세요.',
  },
]

interface MileageStoreState {
  balance: number
  requests: MileageRequest[]
  seq: number
  /** 구매 요청 제출 — 자동 승인이면 즉시 차감, 아니면 PENDING으로 보존. 생성된 요청을 반환. */
  submit: (input: {
    product: string
    amount: number
    autoApprove: boolean
    memo?: string
    link?: string
  }) => MileageRequest
  reset: () => void
}

const pad = (n: number, len: number) => String(n).padStart(len, '0')

export const useMileageStore = create<MileageStoreState>((set, get) => ({
  balance: INITIAL_BALANCE,
  requests: SEED_REQUESTS,
  seq: 100,
  submit: ({ product, amount, autoApprove, memo, link }) => {
    const seq = get().seq + 1
    const now = new Date()
    const ymd = `${now.getFullYear()}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}`
    const status: RequestStatus = autoApprove ? 'approved' : 'pending'
    const req: MileageRequest = {
      id: `MLG-${ymd.replace(/-/g, '')}-${pad(seq, 3)}`,
      product,
      amount,
      status,
      date: ymd,
      memo,
      link,
    }
    set((s) => ({
      seq,
      requests: [req, ...s.requests],
      // 승인 후 차감: 자동 승인(approved)만 즉시 차감, 검토 대기(pending)는 보존
      balance: status === 'approved' ? s.balance - amount : s.balance,
    }))
    return req
  },
  reset: () =>
    set({ balance: INITIAL_BALANCE, requests: SEED_REQUESTS, seq: 100 }),
}))
