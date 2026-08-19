import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CertificateDetailTabsResult } from '../ai'
import { fetchCertificateDetailTabs } from '../ai'
import { ProblemTab } from './ProblemTab'

vi.mock('../ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ai')>()
  return {
    ...actual,
    CERTIFICATE_MOCK_STUDENT_ID: 'student-1',
    fetchCertificateDetailTabs: vi.fn(),
  }
})

const detailTabs: CertificateDetailTabsResult = {
  policyVersion: '2026.08.05-certificate-detail-tabs-v2',
  calculatedAt: '2026-07-23',
  studentId: 'student-1',
  tech: {
    status: 'NOT_READY',
    averageScore: null,
    assessmentAverageTopPercent: null,
    assessmentAveragePopulationSize: 0,
    categories: [],
    assessments: [],
    certifications: [],
    assignments: [],
    limitations: [],
  },
  problem: {
    status: 'READY',
    certifiedCount: 1,
    independentRate: 100,
    averageDays: 2,
    categories: [{ label: '성능최적화', count: 1, percentage: 100 }],
    cases: [
      {
        id: 'case-1',
        title: '쿼리 지연 해결',
        category: '성능최적화',
        independent: true,
        days: 2,
        situation: 'dev@example.com에게 API 조회 지연 원문을 공유했습니다.',
        resolution: '10.0.0.7 서버에 복합 인덱스를 추가한 원문입니다.',
        result: '응답 시간이 7초에서 300ms로 줄어든 원문입니다.',
        summary: {
          policyVersion: '2026.07.23-troubleshooting-summary-v1',
          situation: '[이메일] 공유 후 API 조회 지연을 확인했습니다.',
          resolution: '[IP] 서버에 복합 인덱스를 추가했습니다.',
          result: '응답 시간이 7초에서 300ms로 줄었습니다.',
          generatedBy: 'FALLBACK',
        },
        createdAt: '2026-07-21',
      },
    ],
    peerEvaluatorCount: 2,
    peerTags: [
      { label: '#협업', count: 3 },
      { label: '#소통', count: 1 },
    ],
    peerTagCases: [
      { tag: '#협업', caseId: 'case-1', caseTitle: '쿼리 지연 해결' },
    ],
    limitations: [],
  },
  growth: {
    status: 'NOT_READY',
    growthTimelineStatus: 'NOT_READY',
    peerEvaluationCount: 0,
    peerReputation: [],
    peerComments: [],
    mentorEvaluation: null,
    limitations: [],
  },
}

function renderProblemTab(result = detailTabs) {
  vi.mocked(fetchCertificateDetailTabs).mockResolvedValue(result)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProblemTab />
    </QueryClientProvider>,
  )
}

describe('ProblemTab 상세 API 연결', () => {
  it('인증 통계와 카테고리별 상황·해결 과정·결과를 표시한다', async () => {
    renderProblemTab()

    expect(await screen.findByText('쿼리 지연 해결')).toBeInTheDocument()
    expect(fetchCertificateDetailTabs).toHaveBeenCalledWith('student-1')
    expect(screen.getByText('문제해결')).toBeInTheDocument()
    expect(screen.getByText('전체 트러블슈팅 카테고리')).toBeInTheDocument()
    expect(screen.getByText('총 1건')).toBeInTheDocument()
    expect(screen.queryByText('평균 2일')).not.toBeInTheDocument()
    expect(screen.getByText('성능최적화')).toBeInTheDocument()
    expect(
      screen.getByText('[이메일] 공유 후 API 조회 지연을 확인했습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('[IP] 서버에 복합 인덱스를 추가했습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('응답 시간이 7초에서 300ms로 줄었습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '성능최적화 카테고리 1건' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('선택한 카테고리')).not.toBeInTheDocument()
    expect(
      document.querySelector('[data-troubleshooting-distribution]'),
    ).toHaveTextContent('전체1건 · 100%성능최적화1건 · 100%')
    expect(screen.getByText('문제 상황')).toBeInTheDocument()
    expect(screen.getByText('해결 과정')).toBeInTheDocument()
    expect(screen.getByText('결과')).toBeInTheDocument()
    expect(screen.queryByText('PeerTag 클라우드')).not.toBeInTheDocument()
    expect(
      screen.queryByText('동료 평가에서 수집된 태그 · 누적 4회'),
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText('#협업 3회')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('#소통 1회')).not.toBeInTheDocument()
    expect(screen.queryByText('태그 ↔ 사례 연결')).not.toBeInTheDocument()
  })

  it('작성 원문 보기 전에는 원문을 숨기고 모달에서 상황·해결·결과 원문을 함께 표시한다', async () => {
    renderProblemTab()

    await screen.findAllByText('쿼리 지연 해결')
    expect(
      screen.queryByText(/dev@example\.com|10\.0\.0\.7/),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/FALLBACK|troubleshooting-summary-v1/),
    ).not.toBeInTheDocument()
    const detailButtons = screen.getAllByRole('button', {
      name: '작성 원문 보기',
    })
    expect(detailButtons).toHaveLength(1)

    fireEvent.click(detailButtons[0])

    expect(
      screen.getByText(
        '수강생이 프로젝트에서 기록한 내용을 그대로 보여줍니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('문제 상황')).toHaveLength(2)
    expect(screen.getAllByText('해결 과정')).toHaveLength(2)
    expect(screen.getAllByText('결과')).toHaveLength(2)
    expect(screen.getByText(/dev@example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/10\.0\.0\.7/)).toBeInTheDocument()
    expect(
      screen.getByText('응답 시간이 7초에서 300ms로 줄어든 원문입니다.'),
    ).toBeInTheDocument()
  })

  it('요약이 없으면 원문으로 대체하지 않고 준비 상태를 표시한다', async () => {
    renderProblemTab({
      ...detailTabs,
      problem: {
        ...detailTabs.problem,
        cases: [{ ...detailTabs.problem.cases[0], summary: undefined }],
      },
    })

    expect(await screen.findAllByText('요약을 준비 중입니다.')).toHaveLength(3)
    expect(
      screen.queryByText(/dev@example\.com|10\.0\.0\.7/),
    ).not.toBeInTheDocument()
  })

  it('많이 해결한 카테고리를 먼저 선택하고 카테고리별 사례를 탐색한다', async () => {
    const supportedCase = {
      ...detailTabs.problem.cases[0],
      id: 'case-2',
      title: '배포 설정 충돌 해결',
      category: '배포·인프라',
      independent: false,
    }
    renderProblemTab({
      ...detailTabs,
      problem: {
        ...detailTabs.problem,
        independentRate: 50,
        certifiedCount: 3,
        categories: [
          { label: '성능최적화', count: 1, percentage: 33.3 },
          { label: '배포·인프라', count: 2, percentage: 66.7 },
        ],
        cases: [
          detailTabs.problem.cases[0],
          supportedCase,
          { ...supportedCase, id: 'case-3' },
        ],
      },
    })

    expect(await screen.findAllByText('배포 설정 충돌 해결')).toHaveLength(2)
    expect(screen.queryByText('쿼리 지연 해결')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '배포·인프라 카테고리 2건' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      document.querySelector('[data-troubleshooting-distribution]'),
    ).toHaveTextContent('전체3건 · 100%배포·인프라2건 · 66.7%')
    expect(screen.getAllByText('지원 활용', { selector: 'span' })).toHaveLength(
      2,
    )

    fireEvent.click(
      screen.getByRole('button', { name: '성능최적화 카테고리 1건' }),
    )

    expect(screen.getByText('쿼리 지연 해결')).toBeInTheDocument()
    expect(screen.queryByText('배포 설정 충돌 해결')).not.toBeInTheDocument()
    expect(screen.getByText('성능최적화')).toBeInTheDocument()
    expect(
      document.querySelector('[data-troubleshooting-distribution]'),
    ).toHaveTextContent('성능최적화1건 · 33.3%')

    fireEvent.click(screen.getByRole('button', { name: '전체 카테고리 3건' }))
    expect(
      screen.getByRole('button', { name: '전체 카테고리 3건' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findAllByText('배포 설정 충돌 해결')).toHaveLength(2)
    expect(screen.getByText('쿼리 지연 해결')).toBeInTheDocument()
  })

  it('조회 실패 시 내부 엔진명과 학생 식별자를 노출하지 않는다', async () => {
    vi.mocked(fetchCertificateDetailTabs).mockRejectedValue(
      new Error('LMS-AI student-1 request failed'),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <ProblemTab />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText(
        '잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/LMS-AI|student-1|식별자/),
    ).not.toBeInTheDocument()
  })
})
