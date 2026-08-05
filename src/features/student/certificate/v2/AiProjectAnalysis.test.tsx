import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiProjectAnalysis } from './AiProjectAnalysis'

describe('프로젝트 AI 분석', () => {
  it('대표 프로젝트의 역할·판단·결과·강점을 우선 표시한다', () => {
    const projects = getAiAnalysis('stu-001').projects
    render(<AiProjectAnalysis projects={projects} />)

    expect(screen.getByText('프로젝트 AI 분석')).toBeInTheDocument()
    expect(screen.getByText('AI가 종합한 프로젝트 경쟁력')).toBeInTheDocument()
    expect(screen.getAllByText('개인 역할').length).toBeGreaterThan(0)
    expect(screen.getAllByText('문제와 판단').length).toBeGreaterThan(0)
    expect(screen.getAllByText('검증된 결과').length).toBeGreaterThan(0)
  })

  it('프로젝트 근거가 없으면 빈 패널을 만들지 않는다', () => {
    const projects = {
      ...getAiAnalysis('stu-001').projects,
      projects: [],
    }
    const { container } = render(<AiProjectAnalysis projects={projects} />)

    expect(container).toBeEmptyDOMElement()
  })
})
