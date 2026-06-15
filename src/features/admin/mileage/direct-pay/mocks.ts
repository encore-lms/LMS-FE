import { http, HttpResponse } from 'msw'
import type { DirectPayData, MileageStudent } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 직접 지급 대상 명단 (Figma 1226:6549) ──
const students: MileageStudent[] = [
  {
    id: 'stu-1',
    name: '김민준',
    uuid: 'abc-1234',
    held: 82500,
    used: 42000,
    accrued: 124500,
  },
  {
    id: 'stu-2',
    name: '이서연',
    uuid: 'def-5678',
    held: 24200,
    used: 75800,
    accrued: 100000,
  },
  {
    id: 'stu-3',
    name: '박지훈',
    uuid: 'ghi-9012',
    held: 61000,
    used: 14000,
    accrued: 75000,
  },
  {
    id: 'stu-4',
    name: '최유진',
    uuid: 'jkl-3456',
    held: 97500,
    used: 7500,
    accrued: 105000,
    nearLimit: true,
  },
  {
    id: 'stu-5',
    name: '정하늘',
    uuid: 'mno-7890',
    held: 27800,
    used: 22200,
    accrued: 50000,
  },
  {
    id: 'stu-6',
    name: '한지호',
    uuid: 'pqr-2345',
    held: 48200,
    used: 31800,
    accrued: 80000,
  },
  {
    id: 'stu-7',
    name: '오민서',
    uuid: 'stu-6789',
    held: 15200,
    used: 60800,
    accrued: 76000,
  },
]

const overview: DirectPayData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  totalStudents: 121,
  nearLimitCount: 1,
  students,
}

export const handlers = [
  http.get('/api/admin/mileage/direct-pay', () => ok<DirectPayData>(overview)),
]
