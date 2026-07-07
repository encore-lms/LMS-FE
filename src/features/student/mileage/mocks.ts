import { http, HttpResponse } from 'msw'
import type { MileageOverview } from './types'

// 마일리지 mock — 기능 로컬(features/**/mocks.ts 글롭 자동 수집).
// 로컬(baseURL '/api')에서만 매칭. 배포는 절대 URL이라 실 BE로 통과하고,
// 마일리지 미사용 과정(404 등)이면 대시보드 ProfileCard가 스탯을 자동 숨긴다.
const ok = <T>(data: T) => HttpResponse.json({ data })

const overview: MileageOverview = {
  balance: '850',
  balanceDelta: '▲ +120M',
  balanceSub: '이번 주 획득 120M',
  stats: [],
  ledger: [],
  products: [],
  limits: [],
}

export const handlers = [http.get('/api/student/mileage', () => ok(overview))]
