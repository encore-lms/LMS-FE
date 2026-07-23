import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CertificateScoreResult } from '../ai'
import { fetchAiAnalysis, fetchCertificateScore } from '../ai'
import type { CertRecommendation, CertSummaryTab } from '../types'
import { SummaryTab } from './SummaryTab'

vi.mock('../ai', () => ({
  CERTIFICATE_MOCK_STUDENT_ID: 'student-1',
  CERTIFICATE_360_AXIS_KEYS: ['기술', '팀워크', '책임감', '소통', '문제해결'],
  CERTIFICATE_AXIS_KEYS: [
    '기술',
    '소통',
    '팀워크',
    '책임감',
    '문제해결',
    '학습지속성',
  ],
  fetchAiAnalysis: vi.fn(),
  fetchCertificateScore: vi.fn(),
}))

const axis = (
  key: CertificateScoreResult['axes'][number]['key'],
  score: number,
  peerScore: number | null,
  mentorScore: number | null,
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
  comparison: { peerScore, mentorScore },
})

const scoreResult: CertificateScoreResult = {
  policyVersion: '2026.07.21-six-axis-persistence-v4',
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
  overallScore: 71.2,
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
    axis('기술', 54.8, 75, 75),
    axis('소통', 84, 83.8, 85),
    axis('팀워크', 83, 82.5, 85),
    axis('책임감', 74, 73.8, 75),
    axis('문제해결', 36.5, 70, null),
    axis('학습지속성', 95, null, 82.5),
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
      label: '시험 평균',
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
  domainExperience: [
    { label: '커머스', projectCount: 2, percentage: 66.7 },
    { label: '핀테크', projectCount: 1, percentage: 33.3 },
  ],
  warnings: ['수동 채점 대기 시험 1건은 계산에서 제외했습니다.'],
}

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
  it('실제 추천서가 있는 평가자의 추천 마크만 종합 점수에 표시한다', async () => {
    vi.mocked(fetchCertificateScore).mockResolvedValue(scoreResult)
    vi.mocked(fetchAiAnalysis).mockImplementation(
      () => new Promise(() => undefined),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <SummaryTab s={summary} recommendations={recommendations} />
      </QueryClientProvider>,
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
      <QueryClientProvider client={queryClient}>
        <SummaryTab s={summary} />
      </QueryClientProvider>,
    )

    expect(container.querySelector('[data-radar-loading]')).not.toBeNull()
    expect(container.querySelector('[data-radar-scan]')).toHaveClass(
      'animate-spin',
    )
  })

  it('6축 비교와 360도 동료평가 5축을 표시하고 축 클릭 시 평가 기준을 연다', async () => {
    vi.mocked(fetchCertificateScore).mockResolvedValue(scoreResult)
    vi.mocked(fetchAiAnalysis).mockImplementation(
      () => new Promise(() => undefined),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SummaryTab s={summary} />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('71.2')).toBeInTheDocument()
    expect(screen.getByText('Grade B')).toBeInTheDocument()
    expect(screen.getByText('전체 상위 31.7%')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-summary-kpi]')).toHaveLength(6)
    expect(screen.getByText('블로그 제출률')).toBeInTheDocument()
    expect(screen.queryByText('과제 제출률')).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-peer-axis-bar]')).toHaveLength(5)
    expect(screen.getByText('트러블슈팅 인증사례')).toBeInTheDocument()
    expect(screen.getByText('동료 5축 평가')).toBeInTheDocument()
    expect(screen.getByText('역량 비교 레이더')).toBeInTheDocument()
    expect(screen.queryByText('멘토')).not.toBeInTheDocument()
    expect(screen.queryByText('성장')).not.toBeInTheDocument()
    expect(screen.queryByText('강사 검증')).not.toBeInTheDocument()
    expect(screen.queryByText(/8축/)).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-radar-spoke]')).toHaveLength(6)
    expect(container.querySelectorAll('[data-radar-point]')).toHaveLength(12)
    expect(container.querySelector('[data-radar-series="peer"]')).toBeNull()
    expect(
      [...container.querySelectorAll('[data-radar-axis-label]')].map(
        (label) => label.textContent,
      ),
    ).toEqual(['기술', '소통', '팀워크', '책임감', '문제해결', '학습지속성'])

    const threeSixtyPanel = container.querySelector(
      '[data-three-sixty-comparison]',
    )
    expect(threeSixtyPanel).toHaveTextContent('동료 5축 평가 비교')
    expect(threeSixtyPanel).toHaveTextContent(
      '종합 절대점수 · 프로젝트 동료 상호평가',
    )
    expect(container.querySelectorAll('[data-three-sixty-axis]')).toHaveLength(
      5,
    )
    expect(
      container.querySelector('[data-three-sixty-axis="기술"]'),
    ).toHaveTextContent('3.8/5.0')

    expect(
      container.querySelectorAll('[data-radar-axis-trigger]'),
    ).toHaveLength(6)
    expect(
      container.querySelector('[data-radar-axis-clickable="true"]'),
    ).toBeNull()

    expect(container.querySelector('[data-radar-criteria]')).toBeNull()
    fireEvent.click(
      container.querySelector('[data-radar-axis-trigger="기술"]') as Element,
    )
    expect(container.querySelector('[data-radar-criteria]')).toBeNull()
    expect(
      container.querySelector('[data-radar-axis-clickable="true"]'),
    ).toBeNull()

    fireEvent.click(screen.getAllByRole('button', { name: '절대 점수' })[0])
    expect(
      container.querySelector('[data-radar-axis-clickable="true"]'),
    ).not.toBeNull()
    for (const key of [
      '기술',
      '소통',
      '팀워크',
      '책임감',
      '문제해결',
      '학습지속성',
    ]) {
      expect(
        screen.getByRole('button', { name: `${key} 평가 기준 보기` }),
      ).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: '기술 평가 기준 보기' }))
    const technicalCriteria = container.querySelector(
      '[data-radar-criteria="기술"]',
    )
    expect(technicalCriteria).toHaveTextContent('기술 절대 점수 산출 근거')
    expect(
      within(technicalCriteria as HTMLElement).queryByRole('button', {
        name: '동료 5축 평가 비교',
      }),
    ).toBeNull()
    expect(technicalCriteria).toHaveTextContent('1. 사용 데이터')
    expect(technicalCriteria).toHaveTextContent('성취도 평가 전체 평균')
    expect(technicalCriteria).toHaveTextContent('외부 인증 코딩테스트')
    expect(technicalCriteria).toHaveTextContent('2. 판단 근거')
    expect(technicalCriteria).toHaveTextContent('3. 계산 흐름')
    expect(technicalCriteria).toHaveTextContent('4. 결과')

    fireEvent.click(screen.getByRole('button', { name: '소통 평가 기준 보기' }))
    const communicationCriteria = container.querySelector(
      '[data-radar-criteria="소통"]',
    )
    expect(communicationCriteria).toHaveTextContent('1. 사용 데이터')
    expect(communicationCriteria).toHaveTextContent(
      '프로젝트 상호평가 소통 점수',
    )
    expect(communicationCriteria).toHaveTextContent('최종 멘토평가 소통')
    expect(communicationCriteria).toHaveTextContent('4. 결과')

    expect(
      screen.getByRole('button', { name: '절대 점수', pressed: true }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '함께 보기' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '상대 위치' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '동료 5축 평가 비교' }),
    ).toBeInTheDocument()
    expect(container.querySelector('[data-radar-comparison-hit]')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '상대 위치' }))
    fireEvent.click(screen.getByRole('button', { name: '기술 평가 기준 보기' }))
    const relativeCriteria = container.querySelector(
      '[data-radar-criteria="기술"]',
    )
    expect(relativeCriteria).toHaveTextContent('기술 상대 위치 산출 근거')
    expect(relativeCriteria).toHaveTextContent('수강역량증명서 절대 점수')
    expect(relativeCriteria).toHaveTextContent('비교 집단')
    expect(relativeCriteria).toHaveTextContent('동일 기수 유효 300명')
    expect(relativeCriteria).toHaveTextContent('평균 순위 ÷ 모집단')
    expect(relativeCriteria).toHaveTextContent('기수 상위 31.7%')

    fireEvent.click(screen.getByRole('button', { name: '동료 5축 평가 비교' }))
    fireEvent.click(
      container.querySelector('[data-radar-axis-trigger="기술"]') as Element,
    )
    expect(
      container.querySelector('[data-radar-axis-clickable="true"]'),
    ).toBeNull()
    expect(container.querySelector('[data-radar-comparison]')).toBeNull()
    expect(container.querySelector('[data-radar-criteria]')).toBeNull()

    expect(container.querySelector('[data-three-sixty-evidence]')).toBeNull()
    expect(screen.getByText('도메인 경험')).toBeInTheDocument()
    const commerceDomain = container.querySelector(
      '[data-domain-list-item="커머스"]',
    )
    expect(commerceDomain).toHaveTextContent('커머스')
    expect(commerceDomain).toHaveTextContent('66.7%')
    expect(commerceDomain).toHaveTextContent('2개')
  })
})
