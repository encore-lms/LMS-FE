import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ai')>()
  return {
    ...actual,
    fetchAiAnalysis: vi.fn(async () => actual.getAiAnalysis('stu-001')),
  }
})

import { getAiAnalysis } from '../ai'
import { AiTab } from './AiTab'

function renderAiTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AiTab studentId="stu-001" />
    </QueryClientProvider>,
  )
}

describe('AiTab', () => {
  it('오른쪽 산출 근거 버튼으로 상세 패널을 펼치고 접는다', async () => {
    renderAiTab()

    const trigger = await screen.findByRole('button', { name: '분석 기준' })
    const panelTitle = screen.getByText('AI 분석 기준')
    const evidenceText =
      getAiAnalysis('stu-001').jobFit.primaryRole!.evidence.join(' · ')
    const evidence = screen.getByText((content) =>
      content.startsWith(evidenceText),
    )

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(panelTitle).not.toBeVisible()
    expect(evidence).not.toBeVisible()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(panelTitle).toBeVisible()
    expect(evidence).toBeVisible()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(panelTitle).not.toBeVisible()
  })

  it('직무 적합도·프로젝트·트러블슈팅을 선택 탭으로 표시한다', async () => {
    renderAiTab()

    const analysisTabs = await screen.findByRole('tablist', {
      name: 'AI 분석 항목',
    })
    expect(within(analysisTabs).getAllByRole('tab')).toHaveLength(3)
    expect(
      screen.getByRole('tab', { name: /직무 적합도 가장 어울리는 직무/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: /프로젝트 분석 전체 프로젝트/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', {
        name: /트러블슈팅 분석 가장 선명한 해결 영역/,
      }),
    ).toBeInTheDocument()
  })

  it('선택한 분석 상세 하나만 표시한다', async () => {
    renderAiTab()

    const projectTab = await screen.findByRole('tab', {
      name: /프로젝트 분석 전체 프로젝트/,
    })
    expect(document.querySelector('#ai-job-fit')).toBeInTheDocument()
    expect(
      document.querySelector('#ai-project-analysis'),
    ).not.toBeInTheDocument()

    fireEvent.click(projectTab)

    expect(projectTab).toHaveAttribute('aria-selected', 'true')
    expect(document.querySelector('#ai-job-fit')).not.toBeInTheDocument()
    expect(document.querySelector('#ai-project-analysis')).toBeInTheDocument()
    expect(
      document.querySelector('#ai-troubleshooting-analysis'),
    ).not.toBeInTheDocument()
  })

  it('방향키로 다음 분석 탭을 선택한다', async () => {
    renderAiTab()

    const jobFitTab = await screen.findByRole('tab', {
      name: /직무 적합도 가장 어울리는 직무/,
    })
    const projectTab = screen.getByRole('tab', {
      name: /프로젝트 분석 전체 프로젝트/,
    })

    jobFitTab.focus()
    fireEvent.keyDown(jobFitTab, { key: 'ArrowRight' })

    expect(projectTab).toHaveFocus()
    expect(projectTab).toHaveAttribute('aria-selected', 'true')
    expect(document.querySelector('#ai-project-analysis')).toBeInTheDocument()
  })
})
