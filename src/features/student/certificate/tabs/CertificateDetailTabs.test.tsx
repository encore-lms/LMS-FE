import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import type { CertificateDetailTabsResult } from '../ai'
import { fetchCertificateDetailTabs } from '../ai'
import type { CertGrowthTab } from '../types'
import { GrowthTab } from './GrowthTab'
import { ProblemTab } from './ProblemTab'
import { TechTab } from './TechTab'

vi.mock('../ai', () => ({
  CERTIFICATE_MOCK_STUDENT_ID: 'student-1',
  fetchCertificateDetailTabs: vi.fn(),
}))

const result: CertificateDetailTabsResult = {
  policyVersion: '2026.07.23-certificate-detail-tabs-v1',
  calculatedAt: '2026-07-20',
  studentId: 'student-1',
  tech: {
    status: 'READY',
    averageScore: 86,
    assessmentAverageTopPercent: 18,
    assessmentAveragePopulationSize: 40,
    categories: [
      {
        label: '프론트엔드',
        score: 86,
        attemptCount: 2,
        topPercent: 12.5,
        populationSize: 40,
      },
    ],
    assessments: [
      {
        id: 'quiz-1',
        title: 'React 평가',
        category: '프론트엔드',
        score: 86,
        cohortAverageScore: 80,
        relativeScore: 79,
        comparisonCount: 40,
        submittedAt: '2026-06-01',
      },
    ],
    certifications: [
      {
        name: 'PCCE',
        score: 1000,
        grade: 'LV.4',
        status: 'APPROVED',
        scheduledAt: null,
        submittedAt: '2026-05-10',
        issuedAt: '2026-05-12',
        registrationSource: '자가 등록',
      },
      {
        name: 'PCCP',
        score: 91,
        grade: 'LV.4',
        status: 'PENDING',
        scheduledAt: null,
        submittedAt: '2026-06-01',
        issuedAt: null,
        registrationSource: '자가 등록',
      },
      {
        name: 'PCSQL',
        score: null,
        grade: null,
        status: 'SCHEDULED',
        scheduledAt: '2026-07-12',
        submittedAt: null,
        issuedAt: null,
        registrationSource: '자가 등록',
      },
    ],
    assignments: [
      {
        id: 'submission-1',
        week: 'W08',
        subjectName: 'Spring REST API + JWT 인증',
        type: '실습',
        reviewStatus: '완료',
        submissionStatus: '제출',
      },
    ],
    limitations: [],
  },
  problem: {
    status: 'READY',
    certifiedCount: 1,
    independentRate: 100,
    averageDays: 2,
    categories: [{ label: '성능', count: 1, percentage: 100 }],
    cases: [
      {
        id: 'case-1',
        title: '쿼리 지연 해결',
        category: '성능',
        independent: true,
        days: 2,
        situation:
          'API 조회를 점검했습니다. 인덱스가 없어 목록 조회가 지연됐습니다.',
        resolution:
          '실행 계획을 확인했습니다. 인덱스를 추가하고 쿼리를 재설계했습니다.',
        result:
          '변경 내용을 검증했습니다. 응답 시간이 7초에서 300ms로 단축됐습니다.',
        summary: {
          policyVersion: '2026.07.23-troubleshooting-summary-v1',
          situation: '인덱스 부재로 목록 조회가 지연됨',
          resolution: '복합 인덱스 추가와 쿼리 재설계',
          result: '응답 시간이 7초에서 300ms로 단축됨',
          generatedBy: 'AI',
        },
        createdAt: '2026-06-02',
      },
    ],
    peerEvaluatorCount: 2,
    peerTags: [
      { label: '#소통', count: 1 },
      { label: '#협업', count: 3 },
    ],
    peerTagCases: [
      { tag: '#협업', caseId: 'case-1', caseTitle: '쿼리 지연 해결' },
    ],
    limitations: [],
  },
  growth: {
    status: 'PARTIAL',
    growthTimelineStatus: 'NOT_READY',
    peerEvaluationCount: 2,
    peerReputation: [
      { key: '협업', score: 4.5 },
      { key: '소통', score: 4.2 },
      { key: '책임감', score: 4.4 },
      { key: '문제해결', score: 4.1 },
      { key: '기술기여', score: 4.3 },
    ],
    peerComments: [
      {
        comment: '문제를 함께 끝까지 해결했습니다.',
        submittedAt: '2026-06-03',
      },
    ],
    mentorEvaluation: { averageScore: 4.6, submittedAt: '2026-06-04' },
    limitations: [],
  },
}

const growth: CertGrowthTab = {
  timeline: [
    {
      date: '2024-04-17',
      type: '성취도',
      title: '파이썬 성취도 평가',
      score: 54,
    },
    {
      date: '2024-05-10',
      type: 'CS',
      title: '자료구조·운영체제 CS 평가',
      score: 58,
    },
    {
      date: '2024-06-13',
      type: '성취도',
      title: '웹 개발 성취도 평가',
      score: 68,
    },
    {
      date: '2024-07-09',
      type: '성취도',
      title: '머신러닝 성취도 평가',
      score: 75,
    },
    {
      date: '2024-08-07',
      type: 'CS',
      title: '네트워크·데이터베이스 CS 평가',
      score: 80,
    },
    {
      date: '2024-08-28',
      type: '성취도',
      title: 'LLM·배포 성취도 평가',
      score: 86,
    },
  ],
  peerAverage: 4.6,
  peerEvaluationCount: 12,
  reputation: [
    { key: '기술', score: 4.6, detail: 'PR 22 · 코드 리뷰 평균 4.6' },
    { key: '책임감', score: 4.8, detail: '동료 평가 5인 일관' },
    { key: '소통', score: 4.5, detail: '코드리뷰 5회' },
    { key: '성장', score: 4.3, detail: '최근 8주 점수 가속 구간' },
    { key: '팀워크', score: 4.5, detail: '백엔드 4인 협업' },
  ],
  shortComments: [
    {
      quote: '"디버깅 접근이 논리적. 격리 수준 문제를 팀에 잘 설명함."',
      by: '백엔드 동료 A',
      tag: '#논리적설득',
    },
  ],
  recommendations: [
    {
      role: '강사',
      name: '이정훈 강사',
      meta: '백엔드 멘토링 · 6개월',
      quote: '"협업 태도와 기술 깊이 모두 인상적."',
      date: '2026-05-10 작성',
    },
    {
      role: '멘토',
      name: '황설현 멘토',
      meta: '코드 리뷰 · 12회',
      quote: '"구조적 개선 제안이 많음."',
      date: '2026-05-08 작성',
    },
  ],
}

function renderWithQuery(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </ToastProvider>,
  )
}

describe('수강생 증명서 상세 데이터 탭', () => {
  it('기술·검증 원천을 표시한다', async () => {
    vi.mocked(fetchCertificateDetailTabs).mockResolvedValue(result)
    renderWithQuery(<TechTab />)

    expect(await screen.findByText('프론트엔드')).toBeInTheDocument()
    expect(screen.getByText('상위 12.5%')).toBeInTheDocument()
    expect(screen.getByText('PCCE')).toBeInTheDocument()
    expect(
      screen.getByText('승인 1건 · 검토 중 1건 · 응시 예정 1건'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'LV.4 (900–1,000점) · 1,000/1,000점 · 발급 2026-05-12 · 자가 등록',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('제출 2026-06-01 · 자가 등록')).toBeInTheDocument()
    expect(
      screen.getByText('2026-07-12 응시 예정 · 자가 등록'),
    ).toBeInTheDocument()
    expect(screen.queryByText('과제 / 실습 검증')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Spring REST API + JWT 인증'),
    ).not.toBeInTheDocument()
  })

  it('인증 문제해결 사례와 동료 태그를 표시한다', async () => {
    vi.mocked(fetchCertificateDetailTabs).mockResolvedValue(result)
    renderWithQuery(<ProblemTab />)

    expect(await screen.findByText('쿼리 지연 해결')).toBeInTheDocument()
    expect(screen.getByText('#협업')).toBeInTheDocument()
    expect(screen.getByText('대표 트러블슈팅 사례')).toBeInTheDocument()
    expect(screen.queryByText('태그 ↔ 사례 연결')).not.toBeInTheDocument()
    expect(screen.queryByText('인증 사례')).not.toBeInTheDocument()
    expect(screen.queryByText('평균 소요 일수')).not.toBeInTheDocument()
    expect(screen.queryByText('협업 태그')).not.toBeInTheDocument()
    expect(screen.queryByText('동료 평가자')).not.toBeInTheDocument()
    expect(screen.queryByText('독립 해결 비율')).not.toBeInTheDocument()
    expect(screen.queryByText('독립 해결')).not.toBeInTheDocument()
    expect(screen.queryByText(/검토·보완/)).not.toBeInTheDocument()
    expect(screen.getByText('소요 2일')).toBeInTheDocument()
    expect(screen.getByText('상황')).toBeInTheDocument()
    expect(screen.getByText('해결')).toBeInTheDocument()
    expect(screen.getByText('결과')).toBeInTheDocument()
    expect(
      screen.getByText('인덱스 부재로 목록 조회가 지연됨'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        'API 조회를 점검했습니다. 인덱스가 없어 목록 조회가 지연됐습니다.',
      ),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('#협업 3회')).toHaveStyle({ fontSize: '20px' })
    expect(screen.getByLabelText('#소통 1회')).toHaveStyle({ fontSize: '12px' })

    fireEvent.click(
      screen.getByRole('button', {
        name: '쿼리 지연 해결 상황 상세보기',
      }),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('수강생 작성 원문')).toBeInTheDocument()
    expect(
      screen.getByText(
        'API 조회를 점검했습니다. 인덱스가 없어 목록 조회가 지연됐습니다.',
      ),
    ).toBeInTheDocument()
  })

  it('대표 트러블슈팅 사례를 최대 3건만 상황·해결·결과로 표시한다', async () => {
    const cases = Array.from({ length: 4 }, (_, index) => ({
      ...result.problem.cases[0],
      id: `case-${index + 1}`,
      title: `대표 후보 ${index + 1}`,
    }))
    vi.mocked(fetchCertificateDetailTabs).mockResolvedValue({
      ...result,
      problem: {
        ...result.problem,
        certifiedCount: 4,
        cases,
      },
    })

    renderWithQuery(<ProblemTab />)

    expect(await screen.findByText('대표 후보 1')).toBeInTheDocument()
    expect(
      document.querySelectorAll('[data-troubleshooting-case]'),
    ).toHaveLength(3)
    expect(screen.queryByText('대표 후보 4')).not.toBeInTheDocument()
  })

  it('AI 요약이 없으면 원문을 잘라 요약처럼 표시하지 않는다', async () => {
    vi.mocked(fetchCertificateDetailTabs).mockResolvedValue({
      ...result,
      problem: {
        ...result.problem,
        cases: [{ ...result.problem.cases[0], summary: undefined }],
      },
    })

    renderWithQuery(<ProblemTab />)

    expect(
      await screen.findAllByText('AI 요약을 생성하지 못했습니다.'),
    ).toHaveLength(3)
    expect(screen.queryByText(/API 조회를 점검했습니다.*…/)).toBeNull()
  })

  it('성장 궤적·동료 평판·추천서를 증명서 형식으로 표시한다', () => {
    renderWithQuery(<GrowthTab g={growth} />)

    expect(screen.getByText('6개월 평가 6회 +32점')).toBeInTheDocument()
    expect(screen.getByText('동료 5축 평균 4.6')).toBeInTheDocument()
    expect(
      screen.getByText('Skill360 · 누적 12회 동료 평가'),
    ).toBeInTheDocument()
    expect(screen.getByText('#논리적설득')).toBeInTheDocument()
    expect(screen.getByText('추천서 2건')).toBeInTheDocument()
    expect(screen.getByText('강사·멘토 추천서')).toBeInTheDocument()
    expect(screen.getByText('이정훈 강사')).toBeInTheDocument()
    expect(screen.getByText('황설현 멘토')).toBeInTheDocument()

    expect(document.querySelector('[data-growth-trend-line]')).toBeTruthy()
    const growthBar = document.querySelector(
      '[data-growth-bar="2024-07-09"]',
    ) as HTMLElement
    fireEvent.mouseMove(growthBar, { clientX: 160, clientY: 120 })
    const subjectTooltip = document.querySelector(
      '[data-growth-subject-tooltip="2024-07-09"]',
    )
    expect(subjectTooltip).toHaveTextContent('머신러닝')
    expect(subjectTooltip).toHaveTextContent('75점')
    expect(subjectTooltip).not.toHaveTextContent('2024-07-09')
    expect(subjectTooltip).not.toHaveTextContent('성취도 평가')
    fireEvent.mouseLeave(growthBar)
    fireEvent.mouseMove(
      document.querySelector('[data-growth-chart-area]') as HTMLElement,
      { clientX: 160, clientY: 40 },
    )
    expect(
      document.querySelector('[data-growth-subject-tooltip]'),
    ).not.toBeInTheDocument()

    fireEvent.mouseEnter(
      screen.getByRole('button', {
        name: '2024-07-09 머신러닝 성취도 평가 75점 성장 추세 비교',
      }),
    )
    const growthTooltip = screen.getByRole('tooltip')
    expect(growthTooltip).toHaveTextContent('머신러닝 성취도 평가')
    expect(growthTooltip).toHaveTextContent('2024-07-09 · 성취도 평가')
    expect(growthTooltip).toHaveTextContent('현재 시험')
    expect(growthTooltip).toHaveTextContent('직전 시험')
    expect(growthTooltip.textContent?.indexOf('직전 시험')).toBeLessThan(
      growthTooltip.textContent?.indexOf('현재 시험') ?? 0,
    )
    expect(growthTooltip).toHaveTextContent('7점')
    expect(document.querySelector('[data-growth-chart-area]')).toHaveClass(
      'z-auto',
    )
    expect(screen.getByText('04.17')).toBeInTheDocument()
    expect(screen.getByText('08.28')).toBeInTheDocument()
    expect(screen.queryByText(/W\d+/)).not.toBeInTheDocument()
  })

  it('팀원 한줄 코멘트를 기본 비공개로 두고 최대 5개까지만 공개한다', () => {
    const shortComments = Array.from({ length: 6 }, (_, index) => ({
      quote: `"팀원 한줄 코멘트 ${index + 1}"`,
      by: `프로젝트 팀원 ${index + 1}`,
      tag: '#협업',
    }))
    renderWithQuery(<GrowthTab g={{ ...growth, shortComments }} />)

    expect(
      screen.getByRole('heading', { name: '팀원 한줄 코멘트 공개 후보' }),
    ).toBeInTheDocument()
    expect(screen.getByText('공개 0/5')).toBeInTheDocument()

    const visibilityToggles = screen.getAllByRole('switch', {
      name: /팀원 한줄 코멘트 공개/,
    })
    visibilityToggles.slice(0, 5).forEach((toggle) => {
      expect(toggle).toHaveAttribute('aria-checked', 'false')
      fireEvent.click(toggle)
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    })
    expect(screen.getByText('공개 5/5')).toBeInTheDocument()

    fireEvent.click(visibilityToggles[5])
    expect(visibilityToggles[5]).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('status')).toHaveTextContent(
      '팀원 한줄 코멘트는 최대 5개까지 공개할 수 있어요',
    )

    fireEvent.click(visibilityToggles[0])
    fireEvent.click(visibilityToggles[5])
    expect(visibilityToggles[0]).toHaveAttribute('aria-checked', 'false')
    expect(visibilityToggles[5]).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('공개 5/5')).toBeInTheDocument()
  })

  it('멘토 추천서만 있으면 멘토 추천 영역만 표시한다', () => {
    renderWithQuery(
      <GrowthTab
        g={{ ...growth, recommendations: [growth.recommendations[1]] }}
      />,
    )

    expect(screen.getByText('추천서 1건')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '멘토 추천서' }),
    ).toBeInTheDocument()
    expect(screen.getByText('황설현 멘토')).toBeInTheDocument()
    expect(screen.queryByText('이정훈 강사')).not.toBeInTheDocument()
    expect(screen.queryByText('강사·멘토 추천서')).not.toBeInTheDocument()
  })

  it('강사 추천서만 있으면 강사 추천 영역만 표시한다', () => {
    renderWithQuery(
      <GrowthTab
        g={{ ...growth, recommendations: [growth.recommendations[0]] }}
      />,
    )

    expect(screen.getByText('추천서 1건')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '강사 추천서' }),
    ).toBeInTheDocument()
    expect(screen.getByText('이정훈 강사')).toBeInTheDocument()
    expect(screen.queryByText('황설현 멘토')).not.toBeInTheDocument()
    expect(screen.queryByText('강사·멘토 추천서')).not.toBeInTheDocument()
  })

  it('추천서가 없으면 추천 지표와 추천서 영역을 모두 숨긴다', () => {
    const { container } = renderWithQuery(
      <GrowthTab g={{ ...growth, recommendations: [] }} />,
    )

    expect(screen.queryByText('추천서 0건')).not.toBeInTheDocument()
    expect(container.querySelector('[data-recommendation-section]')).toBeNull()
    expect(
      screen.queryByRole('heading', { name: /추천서/ }),
    ).not.toBeInTheDocument()
  })
})
