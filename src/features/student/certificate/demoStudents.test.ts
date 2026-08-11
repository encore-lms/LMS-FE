import { describe, expect, it } from 'vitest'
import {
  applyCertificateDemoStudent,
  CERTIFICATE_DEMO_STUDENTS,
  DEFAULT_CERTIFICATE_DEMO_STUDENT_ID,
  getCertificateDemoStudent,
} from './demoStudents'
import { mockOverview } from './mocks'

describe('certificate demo students', () => {
  it('34기 실제 로스터 26명을 제공하고 기본은 황수빈이다', () => {
    expect(CERTIFICATE_DEMO_STUDENTS).toHaveLength(26)
    expect(
      new Set(CERTIFICATE_DEMO_STUDENTS.map((student) => student.id)).size,
    ).toBe(26)
    // 대표 데모 계정 — 증명서 본인 화면과 같은 값이어야 한다.
    const hwang = getCertificateDemoStudent(DEFAULT_CERTIFICATE_DEMO_STUDENT_ID)
    expect(hwang.name).toBe('황수빈')
    expect(hwang.overallScore).toBe(94.4)
    // 실측 점수 매핑 표본 — 관리자 미리보기 이름 불일치 회귀 방지.
    const song = CERTIFICATE_DEMO_STUDENTS.find((s) => s.name === '송승재')
    expect(song?.timeline.map((t) => t.score)).toEqual([96, 97])
    const lee = CERTIFICATE_DEMO_STUDENTS.find((s) => s.name === '이성민')
    expect(lee?.timeline.map((t) => t.score)).toEqual([50, 47])
  })

  it('모르는 id 는 기본(황수빈)으로 폴백한다', () => {
    expect(getCertificateDemoStudent('없는-id').name).toBe('황수빈')
    expect(getCertificateDemoStudent(null).name).toBe('황수빈')
  })

  it('헤더·성장 평판만 전환하고 프로젝트·이력서는 건드리지 않는다', () => {
    const student = CERTIFICATE_DEMO_STUDENTS.find((s) => s.name === '김건우')!
    const applied = applyCertificateDemoStudent(mockOverview, student)
    expect(applied.header.studentName).toBe('김건우')
    expect(applied.growth.timeline).toBe(student.timeline)
    expect(applied.projects).toBe(mockOverview.projects)
  })
})
