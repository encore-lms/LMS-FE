import { http, HttpResponse } from 'msw'
import type { MileageOverview } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 마일리지 관리 허브 (Figma 1127:5639) ──
const overview: MileageOverview = {
  hero: {
    course: 'AI 캠프',
    cohortLabel: '22기 · 121명',
    issued: 2840500,
    used: 1127800,
    usedRate: '39.7%',
    balance: 1712700,
    studentCount: 121,
  },
  alerts: [
    {
      id: 'limit',
      label: '한도 초과',
      count: '3건',
      note: '타입 한도 초과 — 처리 보류',
      tone: 'warning',
    },
    {
      id: 'failed',
      label: '처리 실패',
      count: '2건',
      note: '재처리 대상',
      tone: 'danger',
    },
    {
      id: 'partial',
      label: '부분 지급',
      count: '5건',
      note: '일괄 지급 중 일부 실패',
      tone: 'info',
    },
    {
      id: 'order',
      label: '구매 요청 상태',
      count: '8건',
      note: '최근 24시간 변경',
      tone: 'neutral',
    },
  ],
  tabs: [
    {
      id: 'history',
      title: '지급 내역',
      model: 'MileageTransaction · MileageAccount',
      description: '지급·차감 원장 조회 · 일자·수강생·타입·사유별 필터',
      stats: [
        { label: '이번 달 거래', value: '482건' },
        { label: '지급', value: '+312,500M', positive: true },
        { label: '차감', value: '-187,200M' },
      ],
      cta: '지급 내역 보기',
      route: '/admin/mileage/history',
      ready: true,
    },
    {
      id: 'direct-pay',
      title: '직접 지급',
      model: 'MileageAccount · MileageTransaction',
      description:
        '다중 수강생에게 직접 지급·차감 · 사유 필수 · 한도 자동 검증',
      stats: [
        { label: '오늘 직접 지급', value: '5건' },
        { label: '부분 실패', value: '1건' },
      ],
      cta: '직접 지급 열기',
      route: '/admin/mileage/direct-pay',
      ready: true,
    },
    {
      id: 'purchase-requests',
      title: '구매 요청',
      model: 'MileageOrder · MileageOrderItem',
      description: '수강생 구매 요청 승인 · 수정 요청 · 반려 · 처리 큐',
      stats: [
        { label: '승인 대기', value: '12건' },
        { label: '수정 요청', value: '3건' },
        { label: '오늘 처리', value: '23건', positive: true },
      ],
      cta: '구매 요청 열기',
      route: '/admin/mileage/purchase-requests',
    },
    {
      id: 'products',
      title: '상품 관리',
      model: 'MileageProduct',
      description: '마일리지 교환 상품 등록·수정·삭제 · 활성 상태 관리',
      stats: [
        { label: '활성 상품', value: '18개', positive: true },
        { label: '비활성', value: '2개' },
        { label: '새 상품', value: '3개' },
      ],
      cta: '상품 관리 열기',
      route: '/admin/mileage/products',
    },
    {
      id: 'type-limits',
      title: '타입 한도 설정',
      model: 'MileageProductTypeLimit',
      description: '상품 타입별 1인 누적 사용 한도 관리 · 초과 시 자동 차단',
      stats: [
        { label: '활성 한도', value: '3개 타입' },
        { label: '한도 초과 발생', value: '3건' },
      ],
      cta: '타입 한도 열기',
      route: '/admin/mileage/type-limits',
    },
  ],
}

export const handlers = [
  http.get('/api/admin/mileage', () => ok<MileageOverview>(overview)),
]
