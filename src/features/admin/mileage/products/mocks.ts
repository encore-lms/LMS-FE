import { http, HttpResponse } from 'msw'
import type { Product, ProductsData } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 마일리지 상품 (Figma 1246:7113) ──
const products: Product[] = [
  {
    id: 'pd-1',
    emoji: '🎁',
    type: 'GIFTICON',
    name: '문화상품권 5만원권',
    priceMode: 'fixed',
    price: '50,000',
    order: 1,
    salesCount: 42,
    active: true,
  },
  {
    id: 'pd-2',
    emoji: '☕',
    type: 'GIFTICON',
    name: '스타벅스 아메리카노 Tall',
    priceMode: 'fixed',
    price: '4,500',
    order: 2,
    salesCount: 128,
    active: true,
  },
  {
    id: 'pd-3',
    emoji: '🍰',
    type: 'GIFTICON',
    name: '메가커피 디저트 세트',
    priceMode: 'fixed',
    price: '6,900',
    order: 3,
    salesCount: 88,
    active: true,
  },
  {
    id: 'pd-4',
    emoji: '📘',
    type: 'BOOK',
    name: '클린 코드',
    priceMode: 'flexible',
    price: null,
    order: 4,
    salesCount: 24,
    active: true,
  },
  {
    id: 'pd-5',
    emoji: '📗',
    type: 'BOOK',
    name: '개발자의 글쓰기',
    priceMode: 'flexible',
    price: null,
    order: 5,
    salesCount: 17,
    active: true,
  },
  {
    id: 'pd-6',
    emoji: '🎬',
    type: 'LECTURE',
    name: '인프런 — Next.js 마스터',
    priceMode: 'flexible',
    price: null,
    order: 6,
    salesCount: 8,
    active: true,
  },
  {
    id: 'pd-7',
    emoji: '🏷️',
    type: 'GIFTICON',
    name: '옛 굿즈 — 노트북 스티커',
    priceMode: 'fixed',
    price: '1,000',
    order: 7,
    salesCount: 0,
    active: false,
  },
  {
    id: 'pd-8',
    emoji: '🎟️',
    type: 'GIFTICON',
    name: '기프티콘 5천원 — 폐기 예정',
    priceMode: 'fixed',
    price: '5,000',
    order: 8,
    salesCount: 42,
    active: false,
    referenced: true,
  },
]

const overview: ProductsData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  total: 18,
  typeCounts: [
    { type: 'all', label: '전체', count: 18 },
    { type: 'GIFTICON', label: '기프티콘', count: 9 },
    { type: 'BOOK', label: '도서', count: 6 },
    { type: 'LECTURE', label: '온라인 강의', count: 3 },
  ],
  products,
  typePricing: [
    {
      type: 'GIFTICON',
      mode: '고정가',
      note: '상품 가격 필수 — 등록 시 매니저가 입력',
    },
    {
      type: 'BOOK',
      mode: '유연가',
      note: '수강생이 구매 시 가격 입력 — 매니저는 가격 입력 안 함',
    },
    {
      type: 'LECTURE',
      mode: '유연가',
      note: '수강생이 구매 시 가격 입력 — 매니저는 가격 입력 안 함',
    },
  ],
}

export const handlers = [
  http.get('/api/admin/mileage/products', () => ok<ProductsData>(overview)),
]
