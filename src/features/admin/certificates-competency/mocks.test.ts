import { describe, expect, it } from 'vitest'
import { demoOf, isCohortEnded, toCertRow } from './mocks'
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

const NOW = new Date('2026-07-29T00:00:00Z')
const ENDED = '2026-06-30'
const OPEN = '2026-12-31'

const rowsOf = (count: number, endDate: string) =>
  Array.from({ length: count }, (_, i) =>
    toCertRow(student(`s-${i}`), '32기', endDate, NOW),
  )

describe('역량 증명서 목록 목데이터', () => {
  it('같은 수강생은 늘 같은 값을 받는다', () => {
    const a = toCertRow(student('s-1'), '32기', ENDED, NOW)
    const b = toCertRow(student('s-1'), '32기', ENDED, NOW)

    expect(a).toEqual(b)
  })

  it('수강생이 다르면 데모도 갈린다', () => {
    const ids = ['s-1', 's-2', 's-3', 's-4', 's-5', 's-6']
    const names = new Set(ids.map((id) => demoOf(id).name))

    expect(names.size).toBeGreaterThan(1)
  })

  it('로스터 값을 그대로 싣는다', () => {
    const row = toCertRow(student('s-9', '김수강'), '30기', ENDED, NOW)

    expect(row.studentName).toBe('김수강')
    expect(row.studentUuid).toBe('100058794696')
    expect(row.cohortLabel).toBe('30기')
  })

  // 진행 중인 기수가 발급된 것처럼 보이면 안 된다.
  it('기수가 안 끝났으면 전원 기수 미종료다', () => {
    const rows = rowsOf(20, OPEN)

    expect(rows.every((r) => r.status === 'cohort_open')).toBe(true)
    expect(rows.every((r) => r.overallScore === null)).toBe(true)
    expect(rows.every((r) => !r.openable)).toBe(true)
    expect(rows.every((r) => !r.published)).toBe(true)
  })

  it('기수 종료일이 지나야 준비·발급 상태가 나온다', () => {
    const rows = rowsOf(20, ENDED)

    expect(rows.some((r) => r.status === 'issued')).toBe(true)
    expect(rows.every((r) => r.status !== 'cohort_open')).toBe(true)
  })

  // 상세는 증명서가 나온 건에서만 열린다 — 준비 중인 행은 열어도 볼 게 없다.
  it('증명서 완료만 열 수 있고 점수가 있다', () => {
    const rows = rowsOf(40, ENDED)
    const openable = rows.filter((r) => r.openable)

    expect(openable.length).toBeGreaterThan(0)
    expect(openable.every((r) => r.status === 'issued')).toBe(true)
    expect(openable.every((r) => typeof r.overallScore === 'number')).toBe(true)
    expect(
      rows.filter((r) => !r.openable).every((r) => r.overallScore === null),
    ).toBe(true)
  })

  it('공개는 증명서가 나온 뒤에만 켜진다', () => {
    const published = rowsOf(40, ENDED).filter((r) => r.published)

    expect(published.length).toBeGreaterThan(0)
    expect(published.every((r) => r.status === 'issued')).toBe(true)
  })

  it('종료일이 없으면 아직 안 끝난 것으로 본다', () => {
    expect(isCohortEnded(null, NOW)).toBe(false)
    expect(isCohortEnded('', NOW)).toBe(false)
    expect(isCohortEnded(ENDED, NOW)).toBe(true)
    expect(isCohortEnded(OPEN, NOW)).toBe(false)
  })
})
