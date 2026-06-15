import { http, HttpResponse } from 'msw'
import type { TypeLimit, TypeLimitsData } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 타입별 maxPerUser 한도 (Figma 1252:7320) ──
const limits: TypeLimit[] = [
  {
    type: 'GIFTICON',
    label: '기프티콘',
    description: '고정가 상품 — 카페·디저트 등 일상 보상',
    productCount: 9,
    priceMode: '고정가',
    purchaseInput: '수량',
    current: 200000,
    defaultValue: 200000,
  },
  {
    type: 'BOOK',
    label: '도서',
    description: '유연가 상품 — 개발 도서·전문 서적',
    productCount: 6,
    priceMode: '유연가',
    purchaseInput: '링크·가격',
    current: 100000,
    defaultValue: 100000,
  },
  {
    type: 'LECTURE',
    label: '온라인 강의',
    description: '유연가 상품 — 외부 LMS 강의 수강권',
    productCount: 3,
    priceMode: '유연가',
    purchaseInput: '링크·가격',
    current: 200000,
    defaultValue: 200000,
  },
]

const overview: TypeLimitsData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  limits,
}

export const handlers = [
  http.get('/api/admin/mileage/type-limits', () =>
    ok<TypeLimitsData>(overview),
  ),
]
