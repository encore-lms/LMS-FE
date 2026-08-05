import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiJobFit } from './AiJobFit'

describe('직무 적합도 AI 분석', () => {
  it('근거 수치를 노출하지 않고 직무·유형·강점·이론 이해도를 표시한다', () => {
    const jobFit = getAiAnalysis('stu-001').jobFit
    const primary = jobFit.primaryRole!
    render(<AiJobFit jobFit={jobFit} />)

    expect(screen.getByText('가장 어울리는 직무')).toBeInTheDocument()
    expect(screen.getByText(primary.jobLabel)).toBeInTheDocument()
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
})
