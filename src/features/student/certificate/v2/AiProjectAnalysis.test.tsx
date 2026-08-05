import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiProjectAnalysis } from './AiProjectAnalysis'

describe('프로젝트 AI 분석', () => {
  it('대표 프로젝트의 역할·판단·결과·강점을 우선 표시한다', () => {
    const projects = getAiAnalysis('stu-001').projects
    const { container } = render(<AiProjectAnalysis projects={projects} />)

    expect(screen.getByText('프로젝트 AI 분석')).toBeInTheDocument()
    expect(container.querySelector('#ai-project-analysis')).toBeInTheDocument()
    expect(screen.getByText('AI가 종합한 프로젝트 경쟁력')).toBeInTheDocument()
    expect(
      screen.getByText(projects.recruiterSummary.headline),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('이 프로젝트에서 읽히는 실무 강점'),
    ).toHaveLength(2)
    expect(screen.getAllByText('개인 역할').length).toBeGreaterThan(0)
    expect(screen.getAllByText('문제와 판단').length).toBeGreaterThan(0)
    expect(screen.getAllByText('검증된 결과').length).toBeGreaterThan(0)
    expect(screen.getAllByText('AI 종합 해석')).toHaveLength(2)
    expect(screen.getByText('대표 프로젝트 01')).toBeInTheDocument()
    expect(screen.getByText('대표 프로젝트 02')).toBeInTheDocument()
  })

  it('대표 프로젝트 외 분석은 접힌 목록으로 구분한다', () => {
    const projects = getAiAnalysis('stu-001').projects
    const additionalProject = {
      ...projects.projects[1],
      projectId: 'pj3',
      order: 3,
      name: '추가 인증 프로젝트',
    }

    render(
      <AiProjectAnalysis
        projects={{
          ...projects,
          projects: [...projects.projects, additionalProject],
        }}
      />,
    )

    expect(
      screen.getByText('나머지 프로젝트 분석 1개 보기'),
    ).toBeInTheDocument()
    expect(screen.getByText('추가 인증 프로젝트')).toBeInTheDocument()
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
