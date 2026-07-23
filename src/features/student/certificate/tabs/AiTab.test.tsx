import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ai')>()
  return {
    ...actual,
    fetchAiAnalysis: vi.fn(async () => actual.getAiAnalysis('stu-001')),
  }
})

import { AiTab } from './AiTab'

describe('AiTab', () => {
  it('오른쪽 산출 근거 버튼으로 상세 패널을 펼치고 접는다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <AiTab studentId="stu-001" />
      </QueryClientProvider>,
    )

    const trigger = await screen.findByRole('button', { name: '산출 근거' })
    const panelTitle = screen.getByText('AI 분석 산출 근거')

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(panelTitle).not.toBeVisible()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(panelTitle).toBeVisible()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(panelTitle).not.toBeVisible()
  })
})
