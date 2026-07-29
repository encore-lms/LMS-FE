import { describe, expect, it } from 'vitest'
import { demoOf, toCertRow } from './mocks'
import type { StudentAccount } from '@/shared/types'

// 명단은 실제 로스터, 증명서 값은 데모 — 같은 수강생에게는 늘 같은 값이 붙어야
// 새로고침할 때마다 점수가 바뀌지 않는다.
const student = (id: string, name = '박수진'): StudentAccount =>
  ({
    id,
    name,
    studentUuid: '100058794696',
    birthDate: '1999-03-02',
    joinedAt: '04-28',
    lastLoginAt: '오늘 09:18',
    trainingStatus: 'active',
    loginBlocked: false,
    isTest: false,
  }) as StudentAccount

describe('역량 증명서 목록 목데이터', () => {
  it('같은 수강생은 늘 같은 값을 받는다', () => {
    const a = toCertRow(student('s-1'), '32기')
    const b = toCertRow(student('s-1'), '32기')

    expect(a).toEqual(b)
  })

  it('수강생이 다르면 데모도 갈린다', () => {
    const ids = ['s-1', 's-2', 's-3', 's-4', 's-5', 's-6']
    const names = new Set(ids.map((id) => demoOf(id).name))

    expect(names.size).toBeGreaterThan(1)
  })

  it('로스터 값을 그대로 싣는다', () => {
    const row = toCertRow(student('s-9', '김수강'), '30기')

    expect(row.studentName).toBe('김수강')
    expect(row.studentUuid).toBe('100058794696')
    expect(row.cohortLabel).toBe('30기')
  })

  // 검토가 끝나지 않은 증명서를 외부에 여는 일은 없어야 한다.
  it('공개는 인증 완료 건에서만 켜진다', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `s-${i}`)
    const published = ids
      .map((id) => toCertRow(student(id), '32기'))
      .filter((r) => r.published)

    expect(published.length).toBeGreaterThan(0)
    expect(published.every((r) => r.status === 'certified')).toBe(true)
  })
})
