import { http, HttpResponse } from 'msw'
import type { MileageHistoryData, MileageTxRow } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 원장 거래 내역 (Figma 1197:6378) ──
const rows: MileageTxRow[] = [
  {
    id: 'tx-1',
    date: '05-19 14:32',
    studentName: '김민준',
    reason: '중간 발표 우수상 지급',
    amount: '+50,000',
    amountSign: 'plus',
    txType: 'grant',
    balance: '82,500',
    handler: '이매니저',
    handlerNote: '직접 지급',
  },
  {
    id: 'tx-2',
    date: '05-19 11:08',
    studentName: '이서연',
    reason: '문화상품권 5만원권 구매',
    amount: '-50,000',
    amountSign: 'minus',
    txType: 'deduct',
    balance: '24,200',
    handler: '시스템',
    handlerNote: '구매 승인 → 차감',
  },
  {
    id: 'tx-3',
    date: '05-19 09:42',
    studentName: '박지훈',
    reason: '트러블슈팅 사례 채택 보상',
    amount: '+15,000',
    amountSign: 'plus',
    txType: 'grant',
    balance: '61,000',
    handler: '황매니저',
    handlerNote: '직접 지급',
  },
  {
    id: 'tx-4',
    date: '05-18 17:20',
    studentName: '최유진',
    reason: '부분 지급 — 한도 초과로 일부만',
    amount: '+10,000 / 20,000',
    amountSign: 'plus',
    txType: 'partial',
    balance: '34,500',
    handler: '이매니저',
    handlerNote: '직접 지급 → 부분',
  },
  {
    id: 'tx-5',
    date: '05-18 14:15',
    studentName: '정하늘',
    reason: '동료 평판 50건 달성',
    amount: '+5,000',
    amountSign: 'plus',
    txType: 'grant',
    balance: '27,800',
    handler: '시스템',
    handlerNote: '자동 지급',
  },
  {
    id: 'tx-6',
    date: '05-17 16:30',
    studentName: '한지호',
    reason: '커피쿠폰 구매',
    amount: '-3,500',
    amountSign: 'minus',
    txType: 'deduct',
    balance: '48,200',
    handler: '시스템',
    handlerNote: '구매 승인',
  },
  {
    id: 'tx-7',
    date: '05-17 10:42',
    studentName: '김민준',
    reason: '처리 실패 — 한도 초과 차단',
    amount: '0',
    amountSign: 'zero',
    txType: 'failed',
    balance: '32,500',
    handler: '이매니저',
    handlerNote: '직접 지급 → 차단',
  },
]

const overview: MileageHistoryData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  summary: {
    granted: '+312,500',
    grantedHint: '이번 기수 누적',
    deducted: '-187,200',
    deductedHint: '구매 사용 + 회수',
    net: '+125,300',
    netHint: '지급 - 차감',
    count: 482,
    countHint: '이번 기수 거래',
  },
  rows,
  footer: { total: 482, grant: 312, deduct: 162, partial: 5, failed: 3 },
}

export const handlers = [
  http.get('/api/admin/mileage/history', () =>
    ok<MileageHistoryData>(overview),
  ),
]
