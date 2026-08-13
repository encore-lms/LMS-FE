import { describe, expect, it } from 'vitest'
import { quizSchema } from '@/features/instructor/quizzes/quiz.schema'
import {
  isUnlimitedTimeLimit,
  timeLimitLabel,
  UNLIMITED_TIME_LABEL,
} from './quizTimeLimit'

// 템플릿은 제한 시간 0을 '무제한'으로 허용하는데 퀴즈 폼은 1분 이상만 받아
// 무제한 템플릿으로 복제하면 저장이 조용히 막혔다(2026-08-13 QA).
describe('퀴즈 제한 시간', () => {
  it('0·미지정을 무제한으로 본다', () => {
    expect(isUnlimitedTimeLimit(0)).toBe(true)
    expect(isUnlimitedTimeLimit(null)).toBe(true)
    expect(isUnlimitedTimeLimit(undefined)).toBe(true)
    expect(isUnlimitedTimeLimit(60)).toBe(false)
  })

  it('무제한은 분이 아니라 제한 없음으로 적는다', () => {
    expect(timeLimitLabel(0)).toBe(UNLIMITED_TIME_LABEL)
    expect(timeLimitLabel(60)).toBe('60분')
  })

  it('퀴즈 폼은 무제한 템플릿에서 온 0을 통과시킨다', () => {
    const input = {
      title: '무제한 퀴즈',
      cohortId: 'c1',
      startAt: '2026-08-13 10:00',
      endAt: '2026-08-14 10:00',
      timeLimitMin: 0,
    }
    expect(quizSchema.safeParse(input).success).toBe(true)
    expect(quizSchema.safeParse({ ...input, timeLimitMin: -1 }).success).toBe(
      false,
    )
  })
})
