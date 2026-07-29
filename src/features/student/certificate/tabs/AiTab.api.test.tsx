import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { fetchAiAnalysis, getAiAnalysis } from '../ai'
import { AiTab } from './AiTab'

vi.mock('../ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ai')>()
  return {
    ...actual,
    CERTIFICATE_MOCK_STUDENT_ID: 'student-1',
    fetchAiAnalysis: vi.fn(),
  }
})

function renderAiTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AiTab />
    </QueryClientProvider>,
  )
}

describe('AiTab 상세 API 연결', () => {
  it('현재 증명서 학생 ID로 AI 분석을 조회해 프로파일과 페르소나를 표시한다', async () => {
    vi.mocked(fetchAiAnalysis).mockResolvedValue(getAiAnalysis('stu-001'))

    renderAiTab()

    expect(
      await screen.findByRole('heading', { name: 'AI 분석' }),
    ).toBeInTheDocument()
    expect(fetchAiAnalysis).toHaveBeenCalledWith('student-1')
    expect(screen.getByText('AI 역량 프로파일링')).toBeInTheDocument()
    expect(screen.getByText('AI 페르소나 TOP 3')).toBeInTheDocument()
    expect(screen.queryByText('AI · 종합 분석')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/AI 분석은 강사가 인증한 활동을 근거로 한 해석/),
    ).not.toBeInTheDocument()
  })

  it('조회 실패 시 엔진명과 학생 식별자를 노출하지 않는다', async () => {
    vi.mocked(fetchAiAnalysis).mockRejectedValue(
      new Error('LMS-AI student-1 request failed'),
    )

    renderAiTab()

    expect(
      await screen.findByText(
        '잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/LMS-AI|student-1/)).not.toBeInTheDocument()
  })
})
