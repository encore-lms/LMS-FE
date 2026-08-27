import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { createCertificateSevenTabFixture } from '../../analysis/sevenTabFixture'
import { CertificateSevenTabPanel } from './CertificateSevenTabPanel'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

const view = {
  reviewStatus: 'data_ready',
  dataStatus: 'READY',
  analysisStatus: 'READY',
  sourceVersion: 'gold-v1',
  analysisVersion: 'analysis-v1',
  generatedAt: '2026-08-26T00:00:00Z',
  mode: 'PREVIEW',
  statusDetail: {
    runId: '00000000-0000-0000-0000-000000000001',
    queuedAt: '2026-08-26T00:00:00Z',
    startedAt: '2026-08-26T00:00:01Z',
    canGenerate: false,
    canRetry: false,
    lockedReason: null,
    missingRequirements: [],
    failure: null,
  },
  snapshot: null,
  resultSchemaVersion: '2026.08.26-certificate-seven-tab-result-v1',
  tabs: createCertificateSevenTabFixture(),
  analysis: createCertificateSevenTabFixture().aiAnalysis.payload.analysis,
} as const

describe('CertificateSevenTabPanel 단일 BFF 조회', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue({ data: view })
  })

  it('탭을 바꿔도 LMS-SV 분석 조회를 다시 호출하지 않는다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const ui = (active: 'summary' | 'tech') => (
      <QueryClientProvider client={queryClient}>
        <CertificateSevenTabPanel
          active={active}
          target={{ scope: 'student' }}
        />
      </QueryClientProvider>
    )
    const rendered = render(ui('summary'))

    expect(
      await screen.findByRole('heading', { name: '종합 요약' }),
    ).toBeInTheDocument()
    rendered.rerender(ui('tech'))

    expect(
      await screen.findByRole('heading', { name: '기술·검증' }),
    ).toBeInTheDocument()
    expect(apiClient.get).toHaveBeenCalledTimes(1)
    expect(apiClient.get).toHaveBeenCalledWith('/student/certificate/analysis')
  })

  it('한 탭이라도 PARTIAL이면 준비된 탭까지 포함해 증명서 본문을 숨긴다', async () => {
    const tabs = createCertificateSevenTabFixture()
    tabs.resume = {
      ...tabs.resume,
      readinessStatus: 'PARTIAL',
      missingRequirements: [
        {
          code: 'RESUME_MISSING',
          source: 'LMS',
          detail: '완료된 이력서가 없습니다.',
        },
      ],
    }
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { ...view, tabs },
    })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <CertificateSevenTabPanel
          active="summary"
          target={{ scope: 'student' }}
        />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('7개 탭 데이터가 모두 준비되지 않았어요'),
    ).toBeInTheDocument()
    expect(screen.getByText('완료된 이력서가 없습니다.')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '종합 요약' }),
    ).not.toBeInTheDocument()
  })

  it('FAILED이고 서버가 재실행을 허용한 경우에만 다시 분석을 요청한다', async () => {
    const failed = {
      ...view,
      analysisStatus: 'FAILED' as const,
      resultSchemaVersion: null,
      tabs: null,
      analysis: null,
      statusDetail: {
        ...view.statusDetail,
        canRetry: true,
        failure: {
          code: 'AI_TIMEOUT',
          message: '분석 시간이 초과됐습니다.',
          retryable: true,
          failedAt: '2026-08-26T00:05:00Z',
        },
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue({ data: failed })
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        ...failed,
        analysisStatus: 'QUEUED',
        statusDetail: {
          ...failed.statusDetail,
          canRetry: false,
          failure: null,
        },
      },
    })
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <CertificateSevenTabPanel
          active="summary"
          target={{ scope: 'student' }}
        />
      </QueryClientProvider>,
    )

    fireEvent.click(
      await screen.findByRole('button', { name: '다시 분석하기' }),
    )

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/student/certificate/analysis-runs',
        {},
      ),
    )
    expect(
      await screen.findByText('분석을 준비하고 있어요'),
    ).toBeInTheDocument()
  })

  it('원천 버전이 바뀐 STALE 결과는 기존 탭을 노출하지 않는다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...view,
        dataStatus: 'STALE',
        statusDetail: { ...view.statusDetail, canGenerate: true },
      },
    })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <CertificateSevenTabPanel
          active="summary"
          target={{ scope: 'student' }}
        />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('최신 데이터로 다시 분석해야 해요'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '종합 요약' }),
    ).not.toBeInTheDocument()
  })
})
