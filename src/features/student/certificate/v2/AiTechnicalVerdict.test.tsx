import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiTechnicalVerdict } from './AiTechnicalVerdict'

describe('AI 기술 역량 종합 판단', () => {
  it('강점·보완·특이형을 독립 카드로 표시한다', () => {
    const verdict = getAiAnalysis('stu-001').verdict
    render(<AiTechnicalVerdict verdict={verdict} />)

    expect(screen.getByText('핵심 강점')).toBeInTheDocument()
    expect(screen.getByText('성장 포인트')).toBeInTheDocument()
    expect(screen.getByText('보완')).toBeInTheDocument()
    expect(screen.getByText('특이형')).toBeInTheDocument()
    expect(screen.getByText(verdict.strength)).toBeInTheDocument()
  })

  it('정보 버튼으로 직접 근거를 확인한다', () => {
    render(<AiTechnicalVerdict verdict={getAiAnalysis('stu-001').verdict} />)
    fireEvent.click(
      screen.getByRole('button', { name: '핵심 강점 판단 근거 보기' }),
    )

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(screen.getByText('사용 데이터')).toBeInTheDocument()
  })
})
