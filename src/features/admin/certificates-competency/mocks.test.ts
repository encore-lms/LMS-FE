import { describe, expect, it } from 'vitest'
import type { StudentAccount } from '@/shared/types'
import { statusOf, toCertRow } from './mocks'

const student = (id: string, name: string): StudentAccount =>
  ({ id, name, studentUuid: 'stu-' + id, isTest: false }) as StudentAccount

describe('역량 증명서 목록 목데이터', () => {
  it('서버 행이 없으면 항상 기수 진행 중(폴백)이다 — 가짜 해시 상태 금지', () => {
    // 예전에는 id 해시로 상태를 흩뿌려 시연 때 이름·상태가 뒤죽박죽이었다.
    expect(statusOf('아무-id')).toBe('cohort_open')
    const row = toCertRow(student('s-1', '김건우'), '34기')
    expect(row.status).toBe('cohort_open')
    expect(row.openable).toBe(false)
    expect(row.overallScore).toBeNull()
    expect(row.published).toBe(false)
  })

  it('서버 상태 병합용 데모 점수 원본을 함께 나른다', () => {
    const row = toCertRow(
      student('f074a93b-5ad7-4234-ba35-4e260d9272ea', '황수빈'),
      '34기',
    )
    expect(row.demoOverallScore).toBe(94.4)
  })
})
