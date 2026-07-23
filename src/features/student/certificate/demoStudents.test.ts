import { describe, expect, it } from 'vitest'
import type { CertificateDetailTabsResult, CertificateScoreResult } from './ai'
import {
  applyCertificateDemoDetailTabs,
  applyCertificateDemoScore,
  applyCertificateDemoStudent,
  CERTIFICATE_DEMO_STUDENTS,
  getCertificateDemoStudent,
} from './demoStudents'
import type { CertificateOverview } from './types'

const highAchiever = getCertificateDemoStudent(
  '37b48417-d976-5d3a-ab5d-65c10a8c9b5b',
)

describe('certificate demo students', () => {
  it('서로 다른 맥락과 추천 상태를 가진 5명을 제공한다', () => {
    expect(CERTIFICATE_DEMO_STUDENTS).toHaveLength(5)
    expect(
      new Set(CERTIFICATE_DEMO_STUDENTS.map((student) => student.id)).size,
    ).toBe(5)
    expect(CERTIFICATE_DEMO_STUDENTS.map((student) => student.name)).toEqual([
      '박준서',
      '박채원',
      '강다은',
      '황하은',
      '전우진',
    ])
    expect(
      CERTIFICATE_DEMO_STUDENTS.map((student) => student.recommendationState),
    ).toEqual(['BOTH', 'BOTH', 'MENTOR_ONLY', 'INSTRUCTOR_ONLY', 'NONE'])

    const noRecommendation = CERTIFICATE_DEMO_STUDENTS.at(-1)!
    expect(noRecommendation).toMatchObject({
      name: '전우진',
      overallScore: 58,
      highlights: expect.arrayContaining(['출석 82.5%']),
    })
  })

  it('프로젝트와 이력서를 건드리지 않고 헤더·성장평판만 전환한다', () => {
    const projects = { marker: 'original-projects' }
    const overview = {
      header: {
        studentName: '기존 학생',
        cohortName: '기존 기수',
        periodLabel: '기존 기간',
        certId: 'existing',
      },
      projects,
      growth: {
        timeline: [],
        recommendations: [],
        reputation: [],
        shortComments: [],
      },
    } as unknown as CertificateOverview

    const result = applyCertificateDemoStudent(overview, highAchiever)

    expect(result.header.studentName).toBe('박채원')
    expect(result.growth.timeline).toHaveLength(6)
    expect(result.growth.timeline.map((point) => point.type)).toEqual([
      '성취도',
      'CS',
      '성취도',
      '성취도',
      'CS',
      '성취도',
    ])
    expect(result.growth.recommendations).toHaveLength(2)
    expect(result.projects).toBe(projects)
  })

  it('고성취형 점수에는 완료 평가 6회 조건을 일관되게 반영한다', () => {
    const score = {
      overallScore: 87.4,
      axes: [
        { key: '기술', score: 79.3 },
        { key: '소통', score: 76 },
        { key: '팀워크', score: 87 },
        { key: '책임감', score: 99 },
        { key: '문제해결', score: 83.3 },
        { key: '학습지속성', score: 100 },
      ],
      metrics: [{ key: 'assessment', value: 80.3, detail: '채점 완료 3/4건' }],
    } as unknown as CertificateScoreResult

    const result = applyCertificateDemoScore(score, highAchiever.id)

    expect(result.overallScore).toBeGreaterThanOrEqual(80)
    expect(result.axes.find((axis) => axis.key === '기술')?.score).toBe(80.6)
    expect(result.metrics[0]).toMatchObject({
      value: 82,
      detail: '채점 완료 6/6건',
    })
  })

  it('고성취형 상세에는 평가 6회와 PCCE·PCSQL 승인, PCCP 검토를 표시한다', () => {
    const detail = {
      tech: { limitations: [], assessments: [], certifications: [] },
      problem: { limitations: [] },
    } as unknown as CertificateDetailTabsResult

    const result = applyCertificateDemoDetailTabs(detail, highAchiever.id)

    expect(result.tech.assessments).toHaveLength(6)
    expect(result.tech.certifications).toMatchObject([
      { name: 'PCCE', status: 'APPROVED' },
      { name: 'PCCP', status: 'PENDING' },
      { name: 'PCSQL', status: 'APPROVED' },
    ])
    expect(result.problem.limitations.join(' ')).toContain('10건')
    expect(highAchiever.pendingTroubleshootingCount).toBe(10)
  })
})
