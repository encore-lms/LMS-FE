import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  CertificateDetailTabsResult,
  CertificateScoreResult,
  Ontology,
} from '../ai'
import {
  fetchAiAnalysis,
  fetchCertificateDetailTabs,
  fetchCertificateScore,
} from '../ai'
import type { CertRecommendation, CertSummaryTab } from '../types'
import { CertPublicDocContext } from '../publicDoc'
import { SummaryTab } from './SummaryTab'

vi.mock('../ai', () => ({
  CERTIFICATE_MOCK_STUDENT_ID: 'student-1',
  CERTIFICATE_360_AXIS_KEYS: [
    '기술·기술기여',
    '소통·협업·팀워크',
    '문제해결',
    '책임감',
  ],
  CERTIFICATE_AXIS_KEYS: [
    '기술·기술기여',
    '소통·협업·팀워크',
    '문제해결',
    '책임감',
    '학습지속성',
    '성취도 평가',
  ],
  fetchAiAnalysis: vi.fn(),
  fetchCertificateDetailTabs: vi.fn(),
  fetchCertificateScore: vi.fn(),
}))

const axis = (
  key: CertificateScoreResult['axes'][number]['key'],
  score: number,
  peerScore: number | null,
  mentorScore: number | null,
  instructorScore: number | null = null,
  managerScore: number | null = null,
): CertificateScoreResult['axes'][number] => ({
  key,
  score,
  status: 'READY',
  source: `${key} 원천`,
  detail: `${key} 계산 근거`,
  relative: {
    status: 'READY',
    scope: 'ALL_STUDENTS',
    percentile: 68.3,
    topPercent: 31.7,
    populationSize: 300,
    detail: '전체 수강생 유효 300명 중 상위 31.7%입니다.',
  },
  comparison: { peerScore, mentorScore, instructorScore, managerScore },
  evidence: [
    '기술·기술기여',
    '소통·협업·팀워크',
    '문제해결',
    '책임감',
  ].includes(key)
    ? [
        {
          key: 'peerEvaluation',
          label: '동료 평가',
          value: 3.8,
          unit: '점',
          numerator: null,
          denominator: null,
          weightPercent: 25,
          appliedScore: 17.5,
          detail: '동료 평가자 그룹 평균 3.8/5',
        },
        {
          key: 'mentorEvaluation',
          label: '멘토 평가',
          value: 4,
          unit: '점',
          numerator: null,
          denominator: null,
          weightPercent: 25,
          appliedScore: 18.75,
          detail: '멘토 평가자 그룹 평균 4/5',
        },
        {
          key: 'instructorEvaluation',
          label: '강사 평가',
          value: 4.2,
          unit: '점',
          numerator: null,
          denominator: null,
          weightPercent: 25,
          appliedScore: 20,
          detail: '강사 평가자 그룹 평균 4.2/5',
        },
        {
          key: 'managerEvaluation',
          label: '운영 평가',
          value: 4.4,
          unit: '점',
          numerator: null,
          denominator: null,
          weightPercent: 25,
          appliedScore: 21.25,
          detail: '운영 평가자 그룹 평균 4.4/5',
        },
      ]
    : key === '성취도 평가'
      ? [
          {
            key: 'achievementAssessment',
            label: '성취도 평가 전체 평균',
            value: 66,
            unit: '점',
            numerator: 3,
            denominator: 4,
            weightPercent: 100,
            appliedScore: 66,
            detail: '채점 완료 3/4건 전체 평균 66점',
          },
        ]
      : [
          {
            key: 'attendance',
            label: '출석률',
            value: 74.2,
            unit: '%',
            numerator: 115,
            denominator: 155,
            weightPercent: 70,
            appliedScore: 52.5,
            detail: '115/155일 출석 인정',
          },
          {
            key: 'blog',
            label: '블로그 제출률',
            value: 100,
            unit: '%',
            numerator: 26,
            denominator: 26,
            weightPercent: 30,
            appliedScore: 30,
            detail: '26/26주 제출',
          },
          {
            key: 'assignment',
            label: '과제 제출률',
            value: 100,
            unit: '%',
            numerator: 13,
            denominator: 13,
            weightPercent: null,
            appliedScore: 5,
            detail: '13/13건 제출',
          },
          {
            key: 'study',
            label: '스터디 제출률',
            value: 75,
            unit: '%',
            numerator: 6,
            denominator: 8,
            weightPercent: null,
            appliedScore: 4,
            detail: '6/8건 제출',
          },
          {
            key: 'mentoring',
            label: '멘토링 참석률',
            value: 60,
            unit: '%',
            numerator: 6,
            denominator: 10,
            weightPercent: null,
            appliedScore: 3.5,
            detail: '6/10회 참석',
          },
        ],
})

const scoreResult: CertificateScoreResult = {
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
  overallScore: 79.9,
  grade: 'B',
  overallRelative: {
    status: 'READY',
    scope: 'ALL_STUDENTS',
    percentile: 68.3,
    topPercent: 31.7,
    populationSize: 300,
    detail: '전체 수강생 유효 300명 중 상위 31.7%입니다.',
  },
  axes: [
    axis('기술·기술기여', 72.2, 63.7, 75, 75, 75),
    axis('소통·협업·팀워크', 86.3, 82.5, 87.5, 75, 100),
    axis('문제해결', 79.1, 66.3, 75, 75, 100),
    axis('책임감', 80.9, 73.8, 75, 75, 100),
    axis('학습지속성', 95, null, null),
    axis('성취도 평가', 66, null, null),
  ],
  metrics: [
    {
      key: 'attendance',
      label: '출석률',
      value: 74.2,
      maximum: 100,
      unit: '%',
      status: 'READY',
      detail: '출석 인정 115/155일',
    },
    {
      key: 'assessment',
      label: '성취도 평가 평균',
      value: 66,
      maximum: 100,
      unit: '점',
      status: 'READY',
      detail: '채점 완료 3/4건',
    },
    {
      key: 'certifiedProject',
      label: '인증 프로젝트',
      value: 2,
      maximum: 5,
      unit: '건',
      status: 'READY',
      detail: '완료 프로젝트 5건 중 인증 완료',
    },
    {
      key: 'certifiedTroubleshooting',
      label: '트러블슈팅 인증사례',
      value: 4,
      maximum: 6,
      unit: '건',
      status: 'READY',
      detail: '인증 완료 4건 · 문제해결축 6건 기준',
    },
    {
      key: 'certifiedCertificate',
      label: '인증 자격증',
      value: 1,
      maximum: 3,
      unit: '건',
      status: 'READY',
      detail: '등록 3건 중 운영 승인 완료 1건',
    },
    {
      key: 'evaluatorAverage',
      label: '다면역량 평가',
      value: 4.2,
      maximum: 5,
      unit: '점',
      status: 'READY',
      detail: '4개 역량축별 동료·멘토·강사·운영 평가 평균 · 5점 만점',
    },
  ],
  peerEvaluation: [
    { key: '협업', score: 4.5, status: 'READY', detail: '집계 완료' },
    { key: '소통', score: 4.2, status: 'READY', detail: '집계 완료' },
    { key: '책임감', score: 4.6, status: 'READY', detail: '집계 완료' },
    { key: '문제해결', score: 4.3, status: 'READY', detail: '집계 완료' },
    { key: '기술기여', score: 4.4, status: 'READY', detail: '집계 완료' },
  ],
  projectNavigation: {
    issuesProjectId: 'project-issues',
    peerEvaluationProjectId: 'project-peer',
  },
  domainExperience: [
    { label: '커머스', projectCount: 2, percentage: 66.7 },
    { label: '핀테크', projectCount: 1, percentage: 33.3 },
  ],
  warnings: ['수동 채점 대기 시험 1건은 계산에서 제외했습니다.'],
}

const detailTabsResult = {
  tech: {
    assessments: [
      {
        id: 'assessment-python',
        title: '파이썬 기초·데이터 처리 성취도 평가',
        category: '파이썬',
        score: 91,
        cohortAverageScore: 74,
        relativeScore: 82,
        comparisonCount: 24,
        submittedAt: '2026-03-20',
      },
      {
        id: 'assessment-machine-learning',
        title: '머신러닝 모델링 성취도 평가',
        category: '머신러닝',
        score: 87,
        cohortAverageScore: 72,
        relativeScore: 79,
        comparisonCount: 24,
        submittedAt: '2026-04-11',
      },
      {
        id: 'assessment-network',
        title: '네트워크 성취도 평가',
        category: '네트워크',
        score: 78,
        cohortAverageScore: 69,
        relativeScore: 71,
        comparisonCount: 24,
        submittedAt: '2026-04-25',
      },
    ],
    certifications: [
      {
        name: 'PCCE',
        score: 520,
        grade: 'LV.1',
        status: 'APPROVED',
        scheduledAt: null,
        submittedAt: '2026-04-01',
        issuedAt: '2026-04-10',
        registrationSource: '외부 인증 입력',
      },
    ],
  },
} as CertificateDetailTabsResult

const summary: CertSummaryTab = {
  overallScore: 0,
  scoreMax: 100,
  grade: '',
  confirmedLabel: '',
  ratioLabel: '',
  sourceLabel: '',
  kpis: [],
  skillAxes: [],
  skillAvg: 0,
  quizCategories: [],
  evidence: [],
  projects: [],
  checklist: [],
  checkDoneLabel: '',
}

const recommendations: CertRecommendation[] = [
  {
    role: '강사',
    name: '이정훈 강사',
    meta: '백엔드 과정',
    quote: '기술 깊이와 협업 태도가 인상적입니다.',
    date: '2026-05-10 작성',
  },
  {
    role: '멘토',
    name: '황설현 멘토',
    meta: '코드 리뷰',
    quote: '동료의 성장에도 긍정적인 영향을 주었습니다.',
    date: '2026-05-08 작성',
  },
]

const ontologyNotReady: Ontology = {
  policyVersion: '2026.07.21-competency-ontology-v2',
  status: 'NOT_READY',
  summary: '표시 가능한 역량 관계가 없습니다.',
  counts: {
    self: 0,
    subject: 0,
    skill: 0,
    method: 0,
    project: 0,
    domain: 0,
  },
  omittedCounts: {},
  nodes: [],
  edges: [],
}

describe('SummaryTab', () => {
  beforeEach(() => {
    vi.mocked(fetchCertificateDetailTabs).mockResolvedValue(detailTabsResult)
  })

  it('종합 점수의 강사·멘토 추천 배지에서 각 추천 인증서 모달을 연다', async () => {
    vi.mocked(fetchCertificateScore).mockResolvedValue(scoreResult)
    vi.mocked(fetchAiAnalysis).mockImplementation(
      () => new Promise(() => undefined),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <SummaryTab s={summary} recommendations={recommendations} />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await screen.findByText('79.9')
    fireEvent.click(
      screen.getByRole('button', { name: '강사 추천 인증서 보기' }),
    )

    let dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('강사 추천 인증서')).toBeInTheDocument()
    expect(
      within(dialog).getByRole('article', { name: '강사 추천 인증서' }),
    ).toHaveTextContent('기술 깊이와 협업 태도가 인상적입니다.')
    expect(within(dialog).getByText('이정훈 강사')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: '닫기' }))
    fireEvent.click(
      screen.getByRole('button', { name: '멘토 추천 인증서 보기' }),
    )

    dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('멘토 추천 인증서')).toBeInTheDocument()
    expect(
      within(dialog).getByRole('article', { name: '멘토 추천 인증서' }),
    ).toHaveTextContent('동료의 성장에도 긍정적인 영향을 주었습니다.')
    expect(within(dialog).getByText('황설현 멘토')).toBeInTheDocument()
  })

  it.each([
    ['강사', '멘토'],
    ['멘토', '강사'],
  ] as const)(
    '%s 추천만 있으면 해당 추천 배지만 표시한다',
    async (presentRole, absentRole) => {
      vi.mocked(fetchCertificateScore).mockResolvedValue(scoreResult)
      vi.mocked(fetchAiAnalysis).mockImplementation(
        () => new Promise(() => undefined),
      )
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })

      render(
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <SummaryTab
              s={summary}
              recommendations={recommendations.filter(
                (item) => item.role === presentRole,
              )}
            />
          </QueryClientProvider>
        </MemoryRouter>,
      )

      await screen.findByText('79.9')
      expect(screen.getByText('공식 추천')).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: `${presentRole} 추천 인증서 보기`,
        }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', {
          name: `${absentRole} 추천 인증서 보기`,
        }),
      ).not.toBeInTheDocument()
    },
  )

  it('추천 데이터가 없으면 종합 점수에 추천 인증 배지를 표시하지 않는다', async () => {
    vi.mocked(fetchCertificateScore).mockResolvedValue(scoreResult)
    vi.mocked(fetchAiAnalysis).mockImplementation(
      () => new Promise(() => undefined),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <SummaryTab s={summary} />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await screen.findByText('79.9')
    expect(screen.queryByText('공식 추천')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /추천 인증서 보기/ }),
    ).not.toBeInTheDocument()
  })

  it('점수 계산 중에는 회전 스캔 레이더를 표시한다', () => {
    vi.mocked(fetchCertificateScore).mockImplementation(
      () => new Promise(() => undefined),
    )
    vi.mocked(fetchAiAnalysis).mockImplementation(
      () => new Promise(() => undefined),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { container } = render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <SummaryTab s={summary} />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    expect(container.querySelector('[data-axis-gauge-loading]')).not.toBeNull()
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(18)
  })

  it('도메인 경험과 온톨로지 역량 맵을 한 줄의 35:65 영역에 배치한다', async () => {
    vi.mocked(fetchCertificateScore).mockResolvedValue(scoreResult)
    vi.mocked(fetchAiAnalysis).mockResolvedValue({
      ontology: ontologyNotReady,
    } as Awaited<ReturnType<typeof fetchAiAnalysis>>)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { container } = render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <SummaryTab s={summary} />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await screen.findByText('온톨로지 역량 맵')

    const contextLayout = container.querySelector<HTMLElement>(
      '[data-summary-context-layout]',
    )
    const domainCard = screen
      .getByText('도메인 경험')
      .closest('section') as HTMLElement | null
    const ontologyCard = screen
      .getByText('온톨로지 역량 맵')
      .closest('section') as HTMLElement | null

    expect(contextLayout).toContainElement(domainCard)
    expect(contextLayout).toContainElement(ontologyCard)
    expect(contextLayout).toHaveClass(
      'xl:grid-cols-[minmax(0,35fr)_minmax(0,65fr)]',
    )
    expect(domainCard).toHaveAttribute('data-domain-compact', 'true')
    expect(ontologyCard).toHaveAttribute('data-ontology-compact', 'true')
    expect(
      container.querySelector('[data-score-evidence="기술·기술기여"]'),
    ).toBeNull()
    expect(screen.queryByText(/예상 점수|점수 전망/)).not.toBeInTheDocument()
  })

  it('핵심 지표를 관련 화면으로 연결하고 6축 점수를 게이지로 표시한다', async () => {
    vi.mocked(fetchCertificateScore).mockResolvedValue(scoreResult)
    vi.mocked(fetchAiAnalysis).mockImplementation(
      () => new Promise(() => undefined),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { container } = render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <SummaryTab s={summary} />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    const summaryHeading = await screen.findByRole('heading', {
      name: '종합 요약 · 핵심 지표',
    })
    expect(
      summaryHeading.parentElement?.previousElementSibling,
    ).toHaveTextContent('1')

    expect(await screen.findByText('79.9')).toBeInTheDocument()
    expect(
      screen.getByText(
        '산출 흐름 · 학습·성과 지표 → 6축 역량 점수 → 절대 종합 점수',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('6축 역량 점수를 종합한 결과')).toBeInTheDocument()
    expect(
      screen.getByText('6축 역량 점수를 산출하는 학습·평가 근거'),
    ).toBeInTheDocument()
    expect(screen.getByText('종합 점수 산출 기준')).toBeInTheDocument()
    expect(screen.queryByText(/mock|정책 2026\.07\.20/)).not.toBeInTheDocument()
    expect(screen.getByText('Grade B')).toBeInTheDocument()
    expect(screen.getAllByText('전체 상위 31.7%')[0]).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: '절대 종합 점수 79.9점' }),
    ).toBeInTheDocument()
    expect(
      container.querySelector('[data-overall-score-progress]'),
    ).toHaveAttribute('stroke-dashoffset', '20.1')
    expect(screen.queryByText('종합 산정 축')).not.toBeInTheDocument()
    expect(screen.queryByText('산출 상태')).not.toBeInTheDocument()
    expect(screen.queryByText('종합 방식')).not.toBeInTheDocument()
    expect(screen.queryByText('데이터 안내')).not.toBeInTheDocument()
    expect(
      screen.queryByText('수동 채점 대기 시험 1건은 계산에서 제외했습니다.'),
    ).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-summary-kpi]')).toHaveLength(4)
    expect(
      [
        ...container.querySelectorAll(
          '[data-summary-learning-grid] [data-summary-kpi]',
        ),
      ].map((item) => item.getAttribute('data-summary-kpi')),
    ).toEqual([
      'attendance',
      'learningPersistenceInputs',
      'assessment',
      'evaluatorAverage',
    ])
    expect(
      container.querySelectorAll('[data-kpi-visual="progress"]'),
    ).toHaveLength(2)
    expect(
      container.querySelectorAll('[data-kpi-visual="evaluation"]'),
    ).toHaveLength(1)
    expect(
      container.querySelectorAll('[data-kpi-visual="learning-components"]'),
    ).toHaveLength(1)
    expect(container.querySelectorAll('[data-learning-input]')).toHaveLength(4)
    const learningInputs = container.querySelector(
      '[data-summary-kpi="learningPersistenceInputs"]',
    )
    expect(learningInputs).toHaveTextContent('블로그 제출')
    expect(learningInputs).toHaveTextContent('과제 제출')
    expect(learningInputs).toHaveTextContent('스터디 참여')
    expect(learningInputs).toHaveTextContent('멘토링 참석')
    expect(learningInputs).toHaveTextContent('30점 반영')
    expect(learningInputs).toHaveTextContent('+5점')
    expect(
      learningInputs?.querySelector('[data-learning-persistence-link-arrow]'),
    ).toBeInTheDocument()
    expect(
      learningInputs
        ?.querySelector('[data-learning-persistence-link-arrow]')
        ?.closest('[data-kpi-link-footer]'),
    ).toBeInTheDocument()
    for (const key of ['attendance', 'assessment']) {
      const linkedKpi = container.querySelector(`[data-summary-kpi="${key}"]`)
      expect(
        linkedKpi
          ?.querySelector('[data-progress-kpi-link-arrow]')
          ?.closest('[data-kpi-link-footer]'),
      ).toBeInTheDocument()
    }
    expect(
      container.querySelector('[data-learning-persistence-calculation]'),
    ).toHaveTextContent('출석 52.5점+블로그 30점+가산점 12.5점=학습지속성 95점')
    expect(
      container.querySelector('[data-summary-kpi="attendance"]'),
    ).toHaveTextContent('6축 반영학습지속성 52.5점출석률 기본점수 70% 반영')
    expect(
      container.querySelector('[data-summary-kpi="assessment"]'),
    ).toHaveTextContent(
      '6축 반영성취도 평가 66점채점 완료 평가의 전체 평균을 직접 반영',
    )
    expect(
      [
        ...container.querySelectorAll(
          '[data-summary-metrics-section], [data-overall-score-gauge]',
        ),
      ].map((item) =>
        item.hasAttribute('data-summary-metrics-section')
          ? 'metrics'
          : 'overall',
      ),
    ).toEqual(['overall', 'metrics'])
    expect(screen.queryByText('블로그 제출률')).not.toBeInTheDocument()
    expect(screen.queryByText('인증·프로젝트 실적')).not.toBeInTheDocument()
    expect(
      container.querySelector('[data-summary-kpi="certifiedProject"]'),
    ).toBeNull()
    expect(
      container.querySelector('[data-summary-kpi="certifiedTroubleshooting"]'),
    ).toBeNull()
    expect(
      container.querySelector('[data-summary-kpi="certifiedCertificate"]'),
    ).toBeNull()
    expect(screen.getByText('4축 평가 전체 평균')).toBeInTheDocument()
    expect(screen.getByText('학습 참여·제출')).toBeInTheDocument()
    expect(
      container.querySelectorAll('[data-evaluator-axis-bar]'),
    ).toHaveLength(4)
    expect(
      container.querySelector('[data-evaluator-axis-bar="기술·기술기여"]'),
    ).toHaveAttribute('data-axis-tone', 'brand')
    expect(
      container.querySelector('[data-evaluator-axis-bar="소통·협업·팀워크"]'),
    ).toHaveAttribute('data-axis-tone', 'info')
    expect(
      container.querySelector('[data-evaluator-axis-bar="문제해결"]'),
    ).toHaveAttribute('data-axis-tone', 'danger')
    expect(
      container.querySelector('[data-evaluator-axis-bar="책임감"]'),
    ).toHaveAttribute('data-axis-tone', 'warning')
    const evaluatorCard = container.querySelector(
      '[data-summary-kpi="evaluatorAverage"]',
    )
    expect(evaluatorCard).toHaveTextContent('기술·기술기여')
    expect(evaluatorCard).toHaveTextContent('소통·협업·팀워크')
    expect(evaluatorCard).toHaveTextContent('문제해결')
    expect(evaluatorCard).toHaveTextContent('책임감')
    expect(evaluatorCard).toHaveTextContent('3.9 / 5 → 72.2점')
    expect(evaluatorCard).toHaveTextContent('동료·멘토·강사·운영 각 25%')
    expect(evaluatorCard?.tagName).toBe('A')
    expect(
      evaluatorCard?.querySelector('[data-kpi-link-footer]'),
    ).toHaveTextContent('평가·추천 탭에서 자세히 보기')
    expect(
      screen.getByRole('link', {
        name: '4축 평가 전체 평균 평가·추천 탭으로 이동',
      }),
    ).toHaveAttribute('href', '/student/certificate?tab=growth-reputation')
    expect(
      screen.getByRole('link', {
        name: '성취도 평가 평균 상세 화면으로 이동',
      }),
    ).toHaveAttribute('href', '/student/quizzes')
    expect(
      screen.getByRole('link', {
        name: '출석률 상세 화면으로 이동',
      }),
    ).toHaveAttribute('href', '/student/attendance')
    expect(
      screen.getByRole('link', {
        name: '학습 참여·제출 블로그 화면으로 이동',
      }),
    ).toHaveAttribute('href', '/student/records?category=blog')
    expect(screen.getByText('6축 역량 점수')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-axis-gauge]')).toHaveLength(6)
    expect(
      container.querySelectorAll('[data-axis-gauge-progress]'),
    ).toHaveLength(6)
    const technicalGauge = container.querySelector(
      '[data-axis-gauge="기술·기술기여"]',
    )
    expect(technicalGauge).toHaveTextContent('기술·기술기여')
    expect(technicalGauge).toHaveTextContent('72.2점')
    expect(technicalGauge).toHaveTextContent('전체 상위 31.7%')
    expect(
      container.querySelector('[data-axis-gauge-progress="기술·기술기여"]'),
    ).toHaveStyle({ width: '72.2%' })

    fireEvent.click(
      screen.getByRole('button', {
        name: '절대 종합 점수 79.9점 · 6축 역량 점수 산출 기준 강조',
      }),
    )
    expect(
      container.querySelector('[data-overall-score-card]'),
    ).toHaveAttribute('data-overall-selected', 'true')
    expect(container.querySelector('[data-axis-gauge-list]')).toHaveAttribute(
      'data-overall-basis-highlighted',
      'true',
    )
    expect(
      [
        ['기술·기술기여', 'brand'],
        ['소통·협업·팀워크', 'info'],
        ['문제해결', 'danger'],
        ['책임감', 'warning'],
        ['학습지속성', 'success'],
        ['성취도 평가', 'accent'],
      ].map(
        ([key, tone]) =>
          container
            .querySelector(`[data-axis-gauge="${key}"]`)
            ?.getAttribute('data-axis-tone') === tone,
      ),
    ).toEqual([true, true, true, true, true, true])
    expect(
      container.querySelector('[data-summary-kpi="attendance"]'),
    ).toHaveAttribute('data-kpi-tone', 'success')
    expect(learningInputs).toHaveAttribute('data-kpi-tone', 'success')
    expect(
      container.querySelector('[data-summary-kpi="assessment"]'),
    ).toHaveAttribute('data-kpi-tone', 'accent')
    fireEvent.click(
      screen.getByRole('button', {
        name: '학습지속성 95점 관련 지표 강조',
      }),
    )
    expect(container.querySelector('[data-axis-gauge-list]')).toHaveAttribute(
      'data-overall-basis-highlighted',
      'false',
    )
    expect(
      container.querySelector('[data-summary-kpi="attendance"]'),
    ).toHaveAttribute('data-axis-highlighted', 'true')
    expect(
      container.querySelector('[data-summary-kpi="attendance"]'),
    ).toHaveTextContent('연결된 지표')
    expect(learningInputs).toHaveAttribute('data-axis-highlighted', 'true')
    expect(learningInputs).toHaveTextContent('연결됨 · 학습지속성')
    expect(
      container.querySelector('[data-summary-kpi="assessment"]'),
    ).toHaveAttribute('data-axis-highlighted', 'false')
    expect(container.querySelector('[data-score-evidence]')).toBeNull()

    fireEvent.click(
      screen.getByRole('button', {
        name: '성취도 평가 66점 관련 지표 강조',
      }),
    )
    expect(
      container.querySelector('[data-summary-kpi="attendance"]'),
    ).toHaveAttribute('data-axis-highlighted', 'false')
    expect(
      container.querySelector('[data-summary-kpi="assessment"]'),
    ).toHaveAttribute('data-axis-highlighted', 'true')
    expect(
      container.querySelector('[data-summary-kpi="assessment"]'),
    ).toHaveTextContent('연결된 지표')

    fireEvent.click(
      screen.getByRole('button', {
        name: '기술·기술기여 72.2점 관련 지표 강조',
      }),
    )
    expect(
      container.querySelector('[data-evaluator-axis-row="기술·기술기여"]'),
    ).toHaveAttribute('data-axis-highlighted', 'true')
    expect(evaluatorCard).toHaveAttribute('data-axis-highlighted', 'true')
    expect(evaluatorCard).toHaveTextContent('연결된 지표')
    expect(
      container.querySelector('[data-evaluator-axis-row="책임감"]'),
    ).toHaveAttribute('data-axis-highlighted', 'false')
    expect(screen.queryByText('역량 비교 레이더')).not.toBeInTheDocument()
    expect(container.querySelector('[data-radar-series]')).toBeNull()
    expect(
      screen.queryByRole('button', { name: '동료 5축 평가 비교' }),
    ).not.toBeInTheDocument()
    expect(container.querySelector('[data-three-sixty-comparison]')).toBeNull()

    expect(screen.getByText('학습·성과 지표')).toBeInTheDocument()
    expect(screen.getByText('경험·역량 맥락')).toBeInTheDocument()
    expect(screen.getByText('도메인 경험')).toBeInTheDocument()
    const commerceDomain = container.querySelector(
      '[data-domain-list-item="커머스"]',
    )
    expect(commerceDomain).toHaveTextContent('커머스')
    expect(commerceDomain).toHaveTextContent('66.7%')
    expect(commerceDomain).toHaveTextContent('2개')
  })

  it('공개 문서 모드에서는 KPI 카드가 링크가 아니라 정적 카드다', async () => {
    vi.mocked(fetchCertificateScore).mockResolvedValue(scoreResult)
    vi.mocked(fetchAiAnalysis).mockImplementation(
      () => new Promise(() => undefined),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CertPublicDocContext.Provider value={true}>
            <SummaryTab s={summary} />
          </CertPublicDocContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await screen.findByText('79.9')
    // 외부 검증자는 LMS 계정이 없다 — 내부 화면으로 이동하는 링크가 없어야 한다.
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    // 카드 자체(수치·근거)는 그대로 보여 준다.
    const evaluatorCard = document.querySelector(
      '[data-summary-kpi="evaluatorAverage"]',
    )
    expect(evaluatorCard?.tagName).toBe('DIV')
    expect(evaluatorCard).toHaveTextContent('동료·멘토·강사·운영 각 25%')
    // 이동 안내 푸터·화살표도 없어야 한다 — 클릭 유도만 남으면 더 혼란스럽다.
    expect(evaluatorCard?.querySelector('[data-kpi-link-footer]')).toBeNull()
    expect(
      document.querySelector('[data-progress-kpi-link-arrow]'),
    ).toBeNull()
  })
})
