import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CertificateScoreResult } from './types'
import { CERTIFICATE_MOCK_STUDENT_ID, fetchCertificateScore } from './index'

const result: CertificateScoreResult = {
  policyVersion: '2026.08.05-six-axis-four-rater-v2',
  calculatedAt: '2026-07-16',
  student: {
    studentId: 'student-1',
    studentName: '김시우',
    courseName: 'SKN LLM·AI 개발자 과정',
    cohortName: 'SKN 6기',
    cohortStartedAt: '2024-04-22',
    cohortEndedAt: '2024-10-20',
  },
  status: 'READY',
  overallScore: 67.4,
  grade: 'C',
  overallRelative: {
    status: 'READY',
    scope: 'ALL_STUDENTS',
    percentile: 68.3,
    topPercent: 31.7,
    populationSize: 300,
    detail: '전체 수강생 유효 300명 중 상위 31.7%입니다.',
  },
  axes: [],
  metrics: [],
  peerEvaluation: [],
  projectNavigation: {
    issuesProjectId: 'project-1',
    peerEvaluationProjectId: 'project-1',
  },
  domainExperience: [],
  warnings: [],
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('fetchCertificateScore', () => {
  it('발급 조건을 충족하는 기본 시연 수강생을 사용한다', () => {
    expect(CERTIFICATE_MOCK_STUDENT_ID).toBe(
      'd9552119-7a27-5be5-b2a4-1d82a709cfb9',
    )
  })

  it('LMS-AI 점수 엔드포인트에서 최신 정책 결과를 가져온다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => result,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchCertificateScore('student 1')).resolves.toEqual(result)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/scores\/student%201$/),
    )
  })

  it('조회 실패를 다른 학생 점수로 대체하지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    )

    await expect(fetchCertificateScore('missing')).rejects.toThrow(
      '수강역량 점수 조회 실패 (404)',
    )
  })

  it('FE가 지원하지 않는 정책 버전은 표시하지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...result, policyVersion: 'legacy' }),
      }),
    )

    await expect(fetchCertificateScore('student-1')).rejects.toThrow(
      '지원하지 않는 수강역량 점수 정책 버전',
    )
  })

  it('배포 mock 모드에서는 LMS-AI 서버 없이 동일 계약의 시연 데이터를 반환한다', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_ENABLE_MOCK', 'true')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const mockApi = await import('./index')

    const score = await mockApi.fetchCertificateScore('demo-student')
    const tabs = await mockApi.fetchCertificateDetailTabs('demo-student')
    const analysis = await mockApi.fetchAiAnalysis('demo-student')

    expect(score.status).toBe('READY')
    expect(score.student.studentId).toBe('demo-student')
    expect(score.student.studentName).toBe('황수빈')
    expect(score.student.courseName).toBe('SK네트웍스 Family AI 캠프')
    expect(score.student.cohortName).toBe('34기')
    // 6축 평균과 일치해야 한다 — 어긋나면 공개 검증 페이지와도 어긋난다.
    expect(score.overallScore).toBe(93.9)
    expect(score.overallRelative).toMatchObject({
      status: 'READY',
      populationSize: 300,
    })
    expect(score.overallRelative.topPercent).not.toBeNull()
    // 종합 점수는 6축 평균이어야 한다. 어긋나면 수강생 미리보기와 공개 검증(/verify)이
    // 서로 다른 숫자를 보여주게 되고, 검증자는 문서를 믿지 않는다.
    const axisAvg =
      Math.round(
        (score.axes.reduce((sum, axis) => sum + (axis.score ?? 0), 0) /
          score.axes.length) *
          10,
      ) / 10
    expect(score.overallScore).toBe(axisAvg)

    expect(score.axes.map((axis) => axis.key)).toEqual([
      '기술·기술기여',
      '소통·협업·팀워크',
      '문제해결',
      '책임감',
      '학습지속성',
      '성취도 평가',
    ])
    expect(score.axes.every((axis) => axis.evidence.length > 0)).toBe(true)
    expect(
      score.axes.every(
        (axis) =>
          axis.relative.status === 'READY' &&
          axis.relative.populationSize === 300 &&
          axis.relative.percentile !== null &&
          axis.relative.topPercent !== null,
      ),
    ).toBe(true)
    expect(
      score.axes
        .slice(0, 4)
        .every(
          (axis) =>
            axis.comparison.peerScore !== null &&
            axis.comparison.mentorScore !== null &&
            axis.comparison.instructorScore !== null &&
            axis.comparison.managerScore !== null,
        ),
    ).toBe(true)
    expect(tabs.studentId).toBe('demo-student')
    expect(tabs.tech.assessments.length).toBeGreaterThan(0)
    expect(tabs.tech.assessmentAveragePopulationSize).toBe(300)
    expect(
      tabs.tech.assessments.every(
        (assessment) =>
          assessment.comparisonCount === 300 &&
          assessment.cohortAverageScore !== null &&
          assessment.relativeScore !== null,
      ),
    ).toBe(true)
    expect(
      tabs.tech.categories.every(
        (category) =>
          category.populationSize === 300 && category.topPercent !== null,
      ),
    ).toBe(true)
    expect(
      tabs.tech.assessments
        .filter((assessment) => assessment.assessmentType === 'CS')
        .map((assessment) => assessment.score),
    ).toEqual([68, 74, 79, 83])
    expect(
      tabs.tech.categories
        .filter((category) => category.assessmentType === 'CS')
        .map((category) => category.label),
    ).toEqual(['자료구조·알고리즘', '운영체제', '네트워크', '데이터베이스'])
    expect(
      tabs.tech.categories
        .filter((category) => category.assessmentType === 'ACHIEVEMENT')
        .reduce((sum, category) => sum + category.score, 0) / 4,
    ).toBe(81)
    expect(
      tabs.tech.categories
        .filter((category) => category.assessmentType === 'CS')
        .reduce((sum, category) => sum + category.score, 0) / 4,
    ).toBe(76)
    expect(
      tabs.tech.certifications.map(({ name, grade, score, status }) => ({
        name,
        grade,
        score,
        status,
      })),
    ).toEqual([
      {
        name: '정보처리기사',
        grade: '최종합격',
        score: null,
        status: 'APPROVED',
      },
      {
        name: 'SQL 개발자(SQLD)',
        grade: '최종합격',
        score: null,
        status: 'APPROVED',
      },
      {
        name: 'PCCE — 파이썬 코딩 입문',
        grade: 'LV.4',
        score: 940,
        status: 'APPROVED',
      },
      {
        name: 'PCCP — 파이썬 코딩 전문',
        grade: 'LV.4',
        score: 820,
        status: 'APPROVED',
      },
      {
        name: 'PCSQL — SQL 개발자 1급',
        grade: 'LV.3',
        score: 830,
        status: 'APPROVED',
      },
    ])
    expect(tabs.problem.peerTags.length).toBeGreaterThan(0)
    expect(tabs.problem.cases).toHaveLength(12)
    expect(
      tabs.problem.cases.every(
        (item) =>
          item.situation.length > 20 &&
          item.resolution.length > 20 &&
          item.result.length > 20 &&
          item.summary?.generatedBy === 'AI',
      ),
    ).toBe(true)
    expect(tabs.problem.cases.filter((item) => item.independent)).toHaveLength(
      10,
    )
    expect(analysis.projects.projects.length).toBeGreaterThan(0)
    expect(analysis.troubleshooting.groups).toHaveLength(5)
    const educationPeriod = ['2026-04-28', '2026-10-26'] as const
    const isInEducationPeriod = (value: string) =>
      value.slice(0, 10) >= educationPeriod[0] &&
      value.slice(0, 10) <= educationPeriod[1]
    expect(
      tabs.tech.assessments.every((item) =>
        isInEducationPeriod(item.submittedAt),
      ),
    ).toBe(true)
    expect(
      tabs.problem.cases.every((item) => isInEducationPeriod(item.createdAt)),
    ).toBe(true)
    expect(
      analysis.projects.projects.every(
        (project) =>
          isInEducationPeriod(project.period.startedAt) &&
          isInEducationPeriod(project.period.endedAt),
      ),
    ).toBe(true)
    expect(analysis.ontology.nodes.length).toBeGreaterThan(0)
    expect(analysis.ontology.edges.length).toBeGreaterThan(0)
    expect(
      analysis.ontology.nodes.find((node) => node.kind === 'self')?.label,
    ).toBe('박수진')
    const ontologyNodeIds = analysis.ontology.nodes.map((node) => node.id)
    expect(
      analysis.ontology.nodes.some((node) => node.label === 'DB·SQL'),
    ).toBe(false)
    expect(
      analysis.ontology.nodes.find((node) => node.id === 'db')?.label,
    ).toBe('DB')
    expect(
      analysis.ontology.nodes.find((node) => node.id === 'sql')?.label,
    ).toBe('SQL')
    expect(ontologyNodeIds.indexOf('db')).toBeLessThan(
      ontologyNodeIds.indexOf('sql'),
    )
    expect(analysis.ontology.edges).toContainEqual(
      expect.objectContaining({
        source: 'db',
        target: 'sql',
        type: 'FOLLOWED_BY',
      }),
    )
    expect(analysis.ontology.edges).toContainEqual(
      expect.objectContaining({
        source: 'be',
        target: 'msa',
        type: 'FOLLOWED_BY',
      }),
    )
    expect(analysis.ontology.edges).toContainEqual(
      expect.objectContaining({
        source: 'db',
        target: 'tx',
        type: 'FOLLOWED_BY',
      }),
    )
    expect(analysis.ontology.edges).toContainEqual(
      expect.objectContaining({
        source: 'mart',
        target: 'msa',
        type: 'APPLIED',
      }),
    )
    expect(
      analysis.ontology.edges.some(
        (edge) => edge.source === 'me' && ['msa', 'tx'].includes(edge.target),
      ),
    ).toBe(false)
    expect(JSON.stringify({ score, tabs, analysis })).not.toContain('박준서')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
