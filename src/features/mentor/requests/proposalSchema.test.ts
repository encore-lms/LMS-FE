import { describe, expect, it } from 'vitest'
import {
  composeScheduleLabel,
  parseScheduleLabel,
  proposalSchema,
} from './proposalSchema'

describe('composeScheduleLabel', () => {
  it('분해값을 M/D(요일) HH:mm ~ HH:mm 로 합성하고 요일은 실제 날짜에서 계산한다', () => {
    expect(
      composeScheduleLabel({
        date: '2026-05-29',
        startTime: '14:00',
        endTime: '16:00',
      }),
    ).toBe('5/29(금) 14:00 ~ 16:00')
    expect(
      composeScheduleLabel({
        date: '2026-06-03',
        startTime: '19:00',
        endTime: '21:00',
      }),
    ).toBe('6/3(수) 19:00 ~ 21:00')
  })
})

describe('parseScheduleLabel', () => {
  it('멘토 시드 라벨(M/D(요일), 연도 없음)을 올해 기준 분해값으로 변환한다', () => {
    const year = new Date().getFullYear()
    expect(parseScheduleLabel('5/29(목) 14:00 ~ 16:00')).toEqual({
      date: `${year}-05-29`,
      startTime: '14:00',
      endTime: '16:00',
    })
  })

  it('ISO 형식 라벨(YYYY-MM-DD)도 그대로 분해한다', () => {
    expect(parseScheduleLabel('2026-06-03 19:00 ~ 21:00')).toEqual({
      date: '2026-06-03',
      startTime: '19:00',
      endTime: '21:00',
    })
  })

  it('파싱 불가 라벨은 빈 값으로 둬 재선택을 유도한다', () => {
    expect(parseScheduleLabel('미정')).toEqual({
      date: '',
      startTime: '',
      endTime: '',
    })
  })

  it('합성→파싱 왕복이 분해값을 보존한다', () => {
    const fields = { date: '2026-06-03', startTime: '19:00', endTime: '21:00' }
    expect(parseScheduleLabel(composeScheduleLabel(fields))).toEqual(fields)
  })
})

describe('proposalSchema', () => {
  const valid = {
    date: '2026-06-03',
    startTime: '19:00',
    endTime: '21:00',
    placeType: 'online' as const,
    expectedMinutes: 90,
    placeDetail: 'Zoom',
  }

  it('유효한 입력을 통과시킨다', () => {
    expect(proposalSchema.safeParse(valid).success).toBe(true)
  })

  it('날짜·시각 미선택을 차단한다', () => {
    const r = proposalSchema.safeParse({ ...valid, date: '', startTime: '' })
    expect(r.success).toBe(false)
    if (!r.success) {
      const msgs = r.error.issues.map((i) => i.message)
      expect(msgs).toContain('날짜를 선택해주세요')
      expect(msgs).toContain('시작 시각을 선택해주세요')
    }
  })

  it('종료 시각이 시작보다 이르면 차단한다', () => {
    const r = proposalSchema.safeParse({ ...valid, endTime: '18:00' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0]?.message).toBe(
        '종료 시각은 시작 시각보다 늦어야 합니다',
      )
    }
  })
})
