import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CertificateDetailTabsResult } from '../ai'
import { fetchCertificateDetailTabs } from '../ai'
import { GrowthTab } from './GrowthTab'

vi.mock('../ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ai')>()
  return {
    ...actual,
    CERTIFICATE_MOCK_STUDENT_ID: 'student-1',
    fetchCertificateDetailTabs: vi.fn(),
  }
})

const detailTabs: CertificateDetailTabsResult = {
  policyVersion: '2026.07.23-certificate-detail-tabs-v1',
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
    status: 'NOT_READY',
    certifiedCount: 0,
    independentRate: null,
    averageDays: null,
    categories: [],
    cases: [],
    peerEvaluatorCount: 0,
    peerTags: [],
    peerTagCases: [],
    limitations: [],
  },
  growth: {
    status: 'PARTIAL',
    growthTimelineStatus: 'NOT_READY',
    peerEvaluationCount: 3,
    peerReputation: [
      { key: '협업', score: 4.8 },
      { key: '소통', score: 4.4 },
      { key: '책임감', score: 4.6 },
      { key: '문제해결', score: 4.2 },
      { key: '기술기여', score: 4.5 },
    ],
    peerComments: [
      {
        comment: '리뷰 의견을 빠르게 반영했습니다.',
        submittedAt: '2026-07-20',
      },
      { comment: '문제를 함께 정리해 주었습니다.', submittedAt: '2026-07-22' },
    ],
    mentorEvaluation: {
      averageScore: 4.7,
      submittedAt: '2026-07-21',
    },
    limitations: ['성장 궤적 원천 미연결'],
  },
}

function renderGrowthTab(result = detailTabs) {
  vi.mocked(fetchCertificateDetailTabs).mockResolvedValue(result)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <GrowthTab />
    </QueryClientProvider>,
  )
}

describe('GrowthTab 상세 API 연결', () => {
  it('동료 5축·익명 코멘트·멘토 평균과 성장 준비 상태를 표시한다', async () => {
    const { container } = renderGrowthTab()

    expect(await screen.findByText('동료 평가자 3명')).toBeInTheDocument()
    expect(fetchCertificateDetailTabs).toHaveBeenCalledWith('student-1')
    expect(screen.getByText('동료 평균 4.5')).toBeInTheDocument()
    expect(screen.getAllByText('협업')).toHaveLength(1)
    expect(screen.getByText('기술기여')).toBeInTheDocument()
    expect(
      screen.getByText('문제를 함께 정리해 주었습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('동기수 동료 수강생 · 2026-07-22'),
    ).toBeInTheDocument()
    expect(screen.getByText('멘토 평균 4.7')).toBeInTheDocument()
    expect(screen.getByText('4.7')).toBeInTheDocument()
    expect(
      container.querySelector('[data-growth-timeline-status="NOT_READY"]'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '월별 성장 기록이 쌓이면 역량 변화 추이를 확인할 수 있습니다.',
      ),
    ).toBeInTheDocument()
  })

  it('동료 점수가 없을 때 0점으로 대체하지 않고 산정 대기를 표시한다', async () => {
    renderGrowthTab({
      ...detailTabs,
      growth: {
        ...detailTabs.growth,
        peerReputation: [{ key: '협업', score: null }],
        peerComments: [],
        mentorEvaluation: null,
      },
    })

    expect(await screen.findByText('산정 대기')).toBeInTheDocument()
    expect(
      screen.getByText('공유할 수 있는 동료 코멘트가 없습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('등록된 멘토 평가 요약이 없습니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('0.0')).not.toBeInTheDocument()
  })

  it('최근 코멘트 5건만 익명으로 표시하고 추천서를 만들지 않는다', async () => {
    renderGrowthTab({
      ...detailTabs,
      growth: {
        ...detailTabs.growth,
        peerComments: Array.from({ length: 6 }, (_, index) => ({
          comment: `코멘트 ${index + 1}`,
          submittedAt: `2026-07-${String(index + 10).padStart(2, '0')}`,
        })),
      },
    })

    expect(await screen.findByText('코멘트 6')).toBeInTheDocument()
    expect(screen.queryByText('코멘트 1')).not.toBeInTheDocument()
    expect(screen.queryByText(/강사·멘토 추천|추천서/)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /공개/ }),
    ).not.toBeInTheDocument()
  })

  it('조회 실패 시 엔진명과 수강생 식별자를 노출하지 않는다', async () => {
    vi.mocked(fetchCertificateDetailTabs).mockRejectedValue(
      new Error('LMS-AI student-1 request failed'),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <GrowthTab />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText(
        '잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/LMS-AI|student-1/)).not.toBeInTheDocument()
  })
})
