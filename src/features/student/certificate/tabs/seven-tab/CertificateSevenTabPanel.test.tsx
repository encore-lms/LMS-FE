import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
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
})
