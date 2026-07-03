import { describe, expect, it } from 'vitest'
import { computeSixAxis, derive, gradeFrom, growthTrend } from './derive'
import { RAW_STUBS } from './stubs/raw'

const raw = RAW_STUBS['stu-001']

describe('computeSixAxis (6축 확정 공식)', () => {
  it('기술 = 성취도60 + CS20 + 코테20', () => {
    // 0.6*88 + 0.2*82 + 0.2*70 = 83.2
    expect(computeSixAxis(raw).기술).toBe(83.2)
  })
  it('문제해결 = 인증 트슈 1건당 15점, 상한 100', () => {
    // 8*15 = 120 → 100
    expect(computeSixAxis(raw).문제해결).toBe(100)
  })
  it('책임감 = 출석률80 + 상호평가 책임감20', () => {
    // 0.8*96 + 0.2*90 = 76.8 + 18 = 94.8
    expect(computeSixAxis(raw).책임감).toBe(94.8)
  })
  it('모든 축이 0~100 범위', () => {
    for (const v of Object.values(computeSixAxis(raw))) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })
})

describe('growthTrend (성장 추세)', () => {
  it('시험 2회 미만이면 중립 50', () => {
    expect(growthTrend([{ at: '2026-03-10', score: 80 }]).normalized).toBe(50)
  })
  it('상승 추세면 50 초과', () => {
    expect(growthTrend(raw.exams).normalized).toBeGreaterThan(50)
  })
  it('하락 추세면 50 미만', () => {
    const down = growthTrend([
      { at: '1', score: 90 },
      { at: '2', score: 70 },
    ])
    expect(down.normalized).toBeLessThan(50)
  })
})

describe('gradeFrom / derive', () => {
  it('등급 구간(A/B/C/D/F)', () => {
    expect(gradeFrom(92)).toBe('A')
    expect(gradeFrom(75)).toBe('C')
    expect(gradeFrom(50)).toBe('F')
  })
  it('derive는 유효한 StudentDerived를 조립한다', () => {
    const d = derive(raw)
    expect(d.studentId).toBe('stu-001')
    expect(d.grade).toMatch(/^[A-F]$/)
    expect(d.peerAgg.소통).toBe(74)
  })
})
