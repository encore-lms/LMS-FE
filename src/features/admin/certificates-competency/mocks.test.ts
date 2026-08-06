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

const rowsOf = (count: number) =>
  Array.from({ length: count }, (_, i) => toCertRow(student(`s-${i}`), '32기'))

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

  // 재료 축과 인증 축을 한 화면에서 다 볼 수 있어야 흐름을 확인할 수 있다.
  it('재료·인증 단계가 고르게 나온다', () => {
    const statuses = new Set(rowsOf(40).map((r) => r.status))

    expect(statuses).toEqual(
      new Set([
        'cohort_open',
        'data_pending',
        'data_ready',
        'requested',
        'reviewing',
        'changes_requested',
        'certified',
      ]),
    )
  })

  // 검토하려면 증명서를 먼저 봐야 한다 — 인증 전에도 열려야 한다.
  it('재료가 갖춰지면 인증 전에도 열 수 있고 점수가 있다', () => {
    const rows = rowsOf(40)
    const openable = rows.filter((r) => r.openable)

    expect(openable.length).toBeGreaterThan(0)
    expect(
      openable.every(
        (r) => r.status !== 'cohort_open' && r.status !== 'data_pending',
      ),
    ).toBe(true)
    expect(openable.some((r) => r.status !== 'certified')).toBe(true)
    expect(openable.every((r) => typeof r.overallScore === 'number')).toBe(true)
    expect(
      rows.filter((r) => !r.openable).every((r) => r.overallScore === null),
    ).toBe(true)
  })

  it('공개는 정식 인증 뒤에만 켜진다', () => {
    const published = rowsOf(40).filter((r) => r.published)

    expect(published.length).toBeGreaterThan(0)
    expect(published.every((r) => r.status === 'certified')).toBe(true)
  })
})
