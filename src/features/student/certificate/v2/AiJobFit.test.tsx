import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiJobFit } from './AiJobFit'

describe('직무 적합도 AI 분석', () => {
  it('근거 수치를 노출하지 않고 직무·유형·강점·이론 이해도를 표시한다', () => {
    const jobFit = getAiAnalysis('stu-001').jobFit
    const primary = jobFit.primaryRole!
    render(<AiJobFit jobFit={jobFit} />)

    expect(screen.getByText('TOP 1 직무 후보')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: primary.jobLabel }),
    ).toBeInTheDocument()
    expect(screen.getByText('개발자 유형')).toBeInTheDocument()
    expect(screen.getByText(primary.workType)).toBeInTheDocument()
    expect(screen.getByText('핵심 강점')).toBeInTheDocument()
    expect(screen.getByText('관련 이론 이해도')).toBeInTheDocument()
    expect(
      screen.getByText(primary.theoryUnderstanding!.label),
    ).toBeInTheDocument()
    expect(
      screen.getByText(primary.theoryUnderstanding!.summary),
    ).toBeInTheDocument()
    primary.theoryUnderstanding!.categories.forEach((category) => {
      expect(screen.queryByText(`${category.score}점`)).not.toBeInTheDocument()
    })
    primary.evidence.forEach((evidence) => {
      expect(screen.queryByText(evidence)).not.toBeInTheDocument()
    })
  })

  it('TOP 3 탭에서 선택한 직무의 현재 상세 분석을 표시한다', async () => {
    const user = userEvent.setup()
    const jobFit = getAiAnalysis('stu-001').jobFit
    const candidates = [...jobFit.roleCandidates].sort(
      (a, b) => a.rank - b.rank,
    )
    render(<AiJobFit jobFit={jobFit} />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')

    await user.click(
      screen.getByRole('tab', { name: /TOP 2 AI 서비스 개발자/ }),
    )

    expect(
      screen.getByRole('tab', { name: /TOP 2 AI 서비스 개발자/ }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('TOP 2 직무 후보')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: candidates[1].jobLabel }),
    ).toBeInTheDocument()
    expect(screen.getByText(candidates[1].workType)).toBeInTheDocument()
    expect(
      screen.getByText(candidates[1].theoryUnderstanding!.summary),
    ).toBeInTheDocument()
  })

  it('직무 후보·개발자 유형·강점·이론 이해도에 실제 데이터 근거를 연결한다', async () => {
    const user = userEvent.setup()
    render(<AiJobFit jobFit={getAiAnalysis('stu-001').jobFit} />)
    ;['직무 후보', '개발자 유형', '핵심 강점', '관련 이론 이해도'].forEach(
      (label) => {
        expect(
          screen.getByRole('button', { name: `${label} 근거 보기` }),
        ).toHaveTextContent('!')
      },
    )
    expect(
      screen.queryByText('분석에 사용한 기본 데이터'),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: '직무 후보 근거 보기' }),
    )
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('관심 직무 · 백엔드 개발자')
    expect(tooltip).toHaveTextContent('기술 태그 · Java')
  })
})
