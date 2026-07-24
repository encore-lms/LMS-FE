import { describe, expect, it } from 'vitest'
import { assignmentSchema } from './assignmentSchema'

// 배정 생성 폼 검증 — 반→팀→멘토·N시간·일지 템플릿 필수.
// 일지 템플릿은 스키마에서 필수 — 미선택이면 배정 불가.

const valid = {
  cohortId: 'coh_da4_b',
  teamId: 'team_pub',
  mentorId: 'mentor_kim',
  allocatedHours: '8',
  logTemplateId: 'tpl_default_v21',
}

describe('assignmentSchema', () => {
  it('정상 입력 — 통과(문자 입력 N시간은 숫자로 강제 변환)', () => {
    const parsed = assignmentSchema.parse(valid)
    expect(parsed.allocatedHours).toBe(8)
  })

  it('필수 누락 — 반·팀·멘토 각각 차단', () => {
    for (const key of ['cohortId', 'teamId', 'mentorId'] as const) {
      const result = assignmentSchema.safeParse({ ...valid, [key]: '' })
      expect(result.success).toBe(false)
    }
  })

  it('템플릿 미선택 — 차단(일지 템플릿 필수)', () => {
    const result = assignmentSchema.safeParse({ ...valid, logTemplateId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('일지 템플릿을 선택해주세요')
    }
  })

  it('N시간 — 빈 값·0·음수 차단(0보다 커야 함)', () => {
    for (const hours of ['', '0', '-2']) {
      const result = assignmentSchema.safeParse({
        ...valid,
        allocatedHours: hours,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '배정 N시간은 0보다 커야 합니다',
        )
      }
    }
  })
})
