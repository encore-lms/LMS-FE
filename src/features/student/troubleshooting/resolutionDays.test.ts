import { describe, expect, it } from 'vitest'
import { maxResolutionDays, resolutionDaysError } from './resolutionDays'

// 아직 오지 않은 날을 소요 일수로 적을 수는 없다. 당일 해결은 1일.
const 오늘 = new Date(2026, 7, 3) // 2026-08-03

describe('maxResolutionDays', () => {
  it('당일 발생이면 1일까지', () => {
    expect(maxResolutionDays('2026-08-03', 오늘)).toBe(1)
  })

  it('이틀 전 발생이면 3일까지', () => {
    expect(maxResolutionDays('2026-08-01', 오늘)).toBe(3)
  })

  it('미래 날짜는 셀 수 없다', () => {
    expect(maxResolutionDays('2026-08-04', 오늘)).toBeNull()
  })

  it('날짜 형식이 아니면 셀 수 없다', () => {
    expect(maxResolutionDays('2026-02-31', 오늘)).toBeNull()
    expect(maxResolutionDays('', 오늘)).toBeNull()
  })
})

describe('resolutionDaysError', () => {
  it('오늘 겪은 문제에 2일은 안 된다', () => {
    expect(resolutionDaysError('2026-08-03', '2', 오늘)).toBe(
      '발생일부터 오늘까지 1일이라 그보다 길게 적을 수 없어요',
    )
  })

  it('8월 1일 발생에 4일은 안 된다', () => {
    expect(resolutionDaysError('2026-08-01', '4', 오늘)).toBe(
      '발생일부터 오늘까지 3일이라 그보다 길게 적을 수 없어요',
    )
  })

  it('범위 안이면 통과', () => {
    expect(resolutionDaysError('2026-08-03', '1', 오늘)).toBeNull()
    expect(resolutionDaysError('2026-08-01', '3', 오늘)).toBeNull()
    expect(resolutionDaysError('2026-07-01', '30', 오늘)).toBeNull()
  })

  // 소요 일수는 필수가 아니다 — 비우면 0일로 저장된다.
  it('비워 두는 건 막지 않는다', () => {
    expect(resolutionDaysError('2026-08-03', '', 오늘)).toBeNull()
  })

  it('발생일이 미래면 그것부터 짚는다', () => {
    expect(resolutionDaysError('2026-08-10', '1', 오늘)).toBe(
      '문제 발생일은 오늘까지만 고를 수 있어요',
    )
  })

  it('발생일을 아직 안 골랐으면 따지지 않는다', () => {
    expect(resolutionDaysError('', '5', 오늘)).toBeNull()
  })
})
