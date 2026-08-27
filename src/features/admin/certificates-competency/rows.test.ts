import { describe, expect, it } from 'vitest'
import type { StudentAccount } from '@/shared/types'
import { toCertRow } from './rows'

describe('역량 증명서 실제 로스터 초기 행', () => {
  it('서버 심사 행이 없으면 가짜 점수나 상세 링크를 만들지 않는다', () => {
    const student = {
      id: 'student-1',
      name: '김건우',
      studentUuid: 'HRD-1',
      isTest: false,
    } as StudentAccount

    const row = toCertRow(student, '34기')

    expect(row).toMatchObject({
      status: 'cohort_open',
      goldStatus: 'UNKNOWN',
      analysisStatus: 'UNKNOWN',
      openable: false,
      published: false,
    })
  })
})
