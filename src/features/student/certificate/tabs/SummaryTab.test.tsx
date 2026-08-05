import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CertificateDetailTabsResult, CertificateScoreResult } from '../ai'
import {
  fetchAiAnalysis,
  fetchCertificateDetailTabs,
  fetchCertificateScore,
} from '../ai'
import type { CertRecommendation, CertSummaryTab } from '../types'
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
    scope: 'COHORT',
    percentile: 68.3,
    topPercent: 31.7,
    populationSize: 300,
    detail: '동일 기수 유효 300명 중 상위 31.7%입니다.',
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
            value: 82,
            unit: '%',
            numerator: 21,
            denominator: 26,
            weightPercent: 30,
            appliedScore: 24,
            detail: '21/26주 제출',
          },
        ],
})

const scoreResult: CertificateScoreResult = {
  policyVersion: '2026.08.05-six-axis-four-rater-v1',
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
      key: 'blog',
      label: '블로그 제출률',
      value: 82,
      maximum: 100,
      unit: '%',
      status: 'READY',
      detail: '제출 완료 21/26건',
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

describe('SummaryTab', () => {
  beforeEach(() => {
    vi.mocked(fetchCertificateDetailTabs).mockResolvedValue(detailTabsResult)
  })

  it('실제 추천서가 있는 평가자의 추천 마크만 종합 점수에 표시한다', async () => {
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

    const instructor = await screen.findByRole('link', {
      name: '강사 추천서 보기',
    })
    const mentor = screen.getByRole('link', { name: '멘토 추천서 보기' })
    expect(instructor).toHaveAttribute(
      'href',
      '/student/certificate?tab=growth-reputation',
    )
    expect(mentor).toHaveAttribute(
      'href',
      '/student/certificate?tab=growth-reputation',
    )
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

    expect(container.querySelector('[data-radar-loading]')).not.toBeNull()
    expect(container.querySelector('[data-radar-scan]')).toHaveClass(
      'animate-spin',
    )
  })

  it('핵심 지표를 관련 화면으로 연결하고 6축별 실제 점수 근거를 표시한다', async () => {
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

    expect(await screen.findByText('79.9')).toBeInTheDocument()
    expect(
      screen.getByText(
        '학습·프로젝트·평가 데이터를 바탕으로 한 6축 절대·상대 산정',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/mock|정책 2026\.07\.20/)).not.toBeInTheDocument()
    expect(screen.getByText('Grade B')).toBeInTheDocument()
    expect(screen.getByText('전체 상위 31.7%')).toBeInTheDocument()
    expect(screen.getByText('종합 산정 축')).toBeInTheDocument()
    expect(screen.getByText('산출 상태')).toBeInTheDocument()
    expect(screen.getByText('종합 방식')).toBeInTheDocument()
    expect(screen.queryByText('데이터 안내')).not.toBeInTheDocument()
    expect(
      screen.queryByText('수동 채점 대기 시험 1건은 계산에서 제외했습니다.'),
    ).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-summary-kpi]')).toHaveLength(6)
    expect(screen.getByText('블로그 제출률')).toBeInTheDocument()
    expect(screen.queryByText('과제 제출률')).not.toBeInTheDocument()
    expect(screen.getByText('트러블슈팅 인증사례')).toBeInTheDocument()
    expect(screen.getByText('동료 5축 평가')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-peer-axis-bar]')).toHaveLength(5)
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
        name: '인증 프로젝트 상세 화면으로 이동',
      }),
    ).toHaveAttribute('href', '/student/projects')
    expect(
      screen.getByRole('link', {
        name: '트러블슈팅 인증사례 상세 화면으로 이동',
      }),
    ).toHaveAttribute('href', '/student/projects/project-issues?tab=issues')
    expect(
      screen.getByRole('link', {
        name: '동료 5축 평가 상세 보기',
      }),
    ).toHaveAttribute(
      'href',
      '/student/projects/project-peer?tab=peer-evaluation',
    )

    expect(screen.getByText('역량 비교 레이더')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-radar-spoke]')).toHaveLength(6)
    expect(container.querySelectorAll('[data-radar-point]')).toHaveLength(12)
    expect(container.querySelector('[data-radar-series="peer"]')).toBeNull()
    expect(
      [...container.querySelectorAll('[data-radar-axis-label]')].map(
        (label) => label.textContent,
      ),
    ).toEqual([
      '기술·기술기여',
      '소통·협업·팀워크',
      '문제해결',
      '책임감',
      '학습지속성',
      '성취도 평가',
    ])
    expect(
      container.querySelectorAll('[data-radar-axis-trigger]'),
    ).toHaveLength(6)
    expect(
      container.querySelector('[data-radar-axis-clickable="true"]'),
    ).not.toBeNull()
    expect(
      screen.queryByRole('button', { name: '동료 5축 평가 비교' }),
    ).not.toBeInTheDocument()
    expect(container.querySelector('[data-three-sixty-comparison]')).toBeNull()

    const technicalEvidence = container.querySelector(
      '[data-score-evidence="기술·기술기여"]',
    )
    expect(technicalEvidence).toHaveTextContent('기술·기술기여 점수')
    expect(technicalEvidence).toHaveTextContent('동료 평가')
    expect(technicalEvidence).toHaveTextContent('멘토 평가')
    expect(technicalEvidence).toHaveTextContent('강사 평가')
    expect(technicalEvidence).toHaveTextContent('운영 평가')
    expect(technicalEvidence).toHaveTextContent('100점 환산 후 25% 반영')
    expect(technicalEvidence).toHaveTextContent('기술·기술기여 최종 72.2점')

    fireEvent.click(screen.getByRole('tab', { name: '소통·협업·팀워크' }))
    const communicationEvidence = container.querySelector(
      '[data-score-evidence="소통·협업·팀워크"]',
    )
    expect(communicationEvidence).toHaveTextContent('소통·협업·팀워크 점수')
    expect(communicationEvidence).toHaveTextContent(
      '소통·협업·팀워크 최종 86.3점',
    )

    fireEvent.click(screen.getByRole('tab', { name: '책임감' }))
    expect(
      container.querySelector('[data-score-evidence="책임감"]'),
    ).toHaveTextContent('책임감 최종 80.9점')

    fireEvent.click(
      screen.getByRole('button', { name: '문제해결 점수 근거 보기' }),
    )
    const problemEvidence = container.querySelector(
      '[data-score-evidence="문제해결"]',
    )
    expect(problemEvidence).toHaveTextContent('문제해결 점수')
    expect(problemEvidence).toHaveTextContent('강사 평가')
    expect(problemEvidence).toHaveTextContent('운영 평가')
    expect(problemEvidence).toHaveTextContent('문제해결 최종 79.1점')

    fireEvent.click(screen.getByRole('tab', { name: '학습지속성' }))
    const learningEvidence = container.querySelector(
      '[data-score-evidence="학습지속성"]',
    )
    expect(learningEvidence).toHaveTextContent('115/155일 · 74.2%')
    expect(learningEvidence).toHaveTextContent(
      '출석률 74.2%의 70% 반영 = 52.5점',
    )
    expect(learningEvidence).toHaveTextContent(
      '블로그 제출률 82%의 30% 반영 = 24점',
    )

    fireEvent.click(screen.getByRole('tab', { name: '성취도 평가' }))
    const achievementEvidence = container.querySelector(
      '[data-score-evidence="성취도 평가"]',
    )
    expect(achievementEvidence).toHaveTextContent('성취도 평가별 점수')
    expect(achievementEvidence).toHaveTextContent('파이썬')
    expect(achievementEvidence).toHaveTextContent('머신러닝')
    expect(achievementEvidence).toHaveTextContent('네트워크')
    expect(achievementEvidence).toHaveTextContent(
      '성취도 평가 전체 평균 = 66점',
    )
    expect(achievementEvidence).toHaveTextContent('성취도 평가 최종 66점')

    expect(
      screen.getByRole('button', { name: '함께 보기', pressed: true }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '상대 위치' }),
    ).toBeInTheDocument()

    expect(screen.getByText('도메인 경험')).toBeInTheDocument()
    const commerceDomain = container.querySelector(
      '[data-domain-list-item="커머스"]',
    )
    expect(commerceDomain).toHaveTextContent('커머스')
    expect(commerceDomain).toHaveTextContent('66.7%')
    expect(commerceDomain).toHaveTextContent('2개')
  })
})
