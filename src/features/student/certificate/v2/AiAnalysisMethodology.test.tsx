import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiAnalysisMethodology } from './AiAnalysisMethodology'

describe('AI 분석 산출 기준', () => {
  it('현재 화면의 세 가지 핵심 분석 기준을 제공한다', () => {
    render(<AiAnalysisMethodology analysis={getAiAnalysis('stu-001')} />)

    // 화면 문구가 'AI 분석 기준'·'트러블슈팅 AI 분석'으로 바뀌었는데 기대가 안 따라와
    // develop CI 가 깨져 있었다 — 실제 렌더에 맞춘다(2026-08-06).
    expect(screen.getByText('AI 분석 기준')).toBeInTheDocument()
    expect(screen.getByText('직무 적합도')).toBeInTheDocument()
    expect(screen.getByText('프로젝트 AI 분석')).toBeInTheDocument()
    expect(screen.getByText('트러블슈팅 AI 분석')).toBeInTheDocument()
    expect(screen.queryByText('6축 교차분석')).not.toBeInTheDocument()
  })
})
