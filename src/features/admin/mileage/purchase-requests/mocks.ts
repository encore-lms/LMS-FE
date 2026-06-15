import { http, HttpResponse } from 'msw'
import type { PurchaseData, PurchaseRequest } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 구매 요청 처리 큐 (Figma 1235:6815) ──
const requests: PurchaseRequest[] = [
  {
    id: 'po-1',
    status: 'pending',
    type: 'BOOK',
    studentName: '이서연',
    productName: '클린 코드 (애자일 소프트웨어 장인 정신)',
    needsLink: true,
    qty: 1,
    price: 24300,
    date: '05-19 10:42',
  },
  {
    id: 'po-2',
    status: 'pending',
    type: 'GIFTICON',
    studentName: '김민준',
    productName: '스타벅스 아메리카노 Tall 쿠폰',
    needsLink: false,
    qty: 5,
    price: 22500,
    date: '05-19 09:18',
  },
  {
    id: 'po-3',
    status: 'pending',
    type: 'LECTURE',
    studentName: '박지훈',
    productName: '인프런 — Next.js 마스터 클래스',
    needsLink: true,
    qty: 1,
    price: 88000,
    date: '05-19 08:42',
    limitExceeded: true,
  },
  {
    id: 'po-4',
    status: 'pending',
    type: 'GIFTICON',
    studentName: '최유진',
    productName: '문화상품권 5만원권',
    needsLink: false,
    qty: 1,
    price: 50000,
    date: '05-18 17:20',
  },
  {
    id: 'po-5',
    status: 'revision',
    type: 'BOOK',
    studentName: '정하늘',
    productName: '개발자의 글쓰기 — 도서',
    needsLink: true,
    qty: 1,
    price: 18000,
    date: '05-18 14:15',
  },
  {
    id: 'po-6',
    status: 'approved',
    type: 'GIFTICON',
    studentName: '한지호',
    productName: '메가커피 디저트 세트',
    needsLink: false,
    qty: 2,
    price: 13800,
    date: '05-17 16:30',
  },
]

const overview: PurchaseData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  kpis: [
    {
      status: 'pending',
      label: 'PENDING',
      count: 12,
      note: '처리 대기 — 승인·수정·반려',
    },
    {
      status: 'approved',
      label: 'APPROVED',
      count: 87,
      note: '승인 완료 — 원장 차감 처리',
    },
    {
      status: 'revision',
      label: 'REVISION',
      count: 3,
      note: '수정 요청 — 재요청 대기',
    },
    {
      status: 'rejected',
      label: 'REJECTED',
      count: 5,
      note: '반려 — 이력 보존',
    },
    { status: 'canceled', label: 'CANCELED', count: 2, note: '수강생 취소' },
  ],
  requests,
  typeNotes: [
    { type: 'BOOK', note: '구매 링크와 신청 가격 확인 필요' },
    { type: 'LECTURE', note: '구매 링크와 신청 가격 확인 필요' },
    {
      type: 'GIFTICON',
      note: '고정가 상품 기준 처리 (등록된 가격으로 자동 차감)',
    },
  ],
  total: 109,
  pendingCount: 12,
  limitExceededCount: 1,
}

export const handlers = [
  http.get('/api/admin/mileage/purchase-requests', () =>
    ok<PurchaseData>(overview),
  ),
]
