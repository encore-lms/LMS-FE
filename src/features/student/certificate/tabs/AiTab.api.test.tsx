import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getAiAnalysis } from '../ai'
import {
  fetchCertificateAnalysis,
  type CertificateAnalysisView,
} from '../analysis'
import { AiTab } from './AiTab'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function view(
  overrides: Partial<CertificateAnalysisView> = {},
): CertificateAnalysisView {
  return {
    reviewStatus: 'data_ready',
    dataStatus: 'READY',
    analysisStatus: 'READY',
    sourceVersion: 'source-v1',
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
    resultSchemaVersion: null,
    tabs: null,
    analysis: getAiAnalysis('stu-001'),
    ...overrides,
  }
}

function renderStudentAiTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AiTab target={{ scope: 'student' }} />
    </QueryClientProvider>,
  )
}

describe('AiTab LMS-SV BFF 연결', () => {
  beforeEach(() => vi.clearAllMocks())

  it('로그인 수강생 분석은 LMS-SV의 본인 조회 경로에서 표시한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: view() })

    renderStudentAiTab()

    expect(
      await screen.findByRole('heading', { name: 'AI 분석' }),
    ).toBeInTheDocument()
    expect(apiClient.get).toHaveBeenCalledWith('/student/certificate/analysis')
    expect(screen.getAllByText('직무 적합도').length).toBeGreaterThan(0)
    expect(screen.getAllByText('프로젝트 분석').length).toBeGreaterThan(0)
    expect(screen.getAllByText('문제해결 역량 분석').length).toBeGreaterThan(0)
  })

  it('분석 시작은 LMS-SV 실행 경로를 호출하고 대기 상태로 전환한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: view({
        analysisStatus: 'NOT_STARTED',
        analysis: null,
        statusDetail: {
          ...view().statusDetail,
          runId: null,
          queuedAt: null,
          startedAt: null,
          canGenerate: true,
        },
      }),
    })
    vi.mocked(apiClient.post).mockResolvedValue({
      data: view({ analysisStatus: 'QUEUED', analysis: null }),
    })

    renderStudentAiTab()
    fireEvent.click(await screen.findByRole('button', { name: 'AI 분석 시작' }))

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

  it('운영 조회는 선택한 수강생 ID를 LMS-SV 경로에 포함한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: view() })

    await fetchCertificateAnalysis({
      scope: 'admin',
      studentId: '00000000-0000-0000-0000-000000000123',
    })

    expect(apiClient.get).toHaveBeenCalledWith(
      '/admin/certificates/00000000-0000-0000-0000-000000000123/analysis',
    )
  })

  it('조회 실패 시 내부 서비스명과 식별자를 노출하지 않는다', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(
      new Error('LMS-AI student-1 request failed'),
    )

    renderStudentAiTab()

    expect(
      await screen.findByText(
        '잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/LMS-AI|student-1/)).not.toBeInTheDocument()
  })
})
