import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiAnalysisMethodology } from './AiAnalysisMethodology'

describe('AI 분석 산출 근거', () => {
  it('7개 분석 블록의 데이터·근거·계산·결과를 제공한다', () => {
    render(<AiAnalysisMethodology analysis={getAiAnalysis('stu-001')} />)

    expect(screen.getByText('AI 분석 산출 근거')).toBeInTheDocument()
    expect(screen.getByText('역량 프로파일링')).toBeInTheDocument()
    expect(screen.getByText('온톨로지')).toBeInTheDocument()
    expect(screen.getByText('1. 사용 데이터')).toBeInTheDocument()
  })

  it('항목을 펼쳐 각 분석 결과를 확인한다', () => {
    render(<AiAnalysisMethodology analysis={getAiAnalysis('stu-001')} />)
    fireEvent.click(screen.getByRole('tab', { name: '프로젝트' }))

    expect(
      screen.getByRole('button', { name: '전체 궤적' }),
    ).toBeInTheDocument()
    expect(screen.getByText('3. 계산 흐름')).toBeInTheDocument()
    expect(screen.getByText('4. 결과')).toBeInTheDocument()
  })
})
