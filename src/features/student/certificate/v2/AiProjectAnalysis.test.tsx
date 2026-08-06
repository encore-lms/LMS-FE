import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAiAnalysis } from '../ai'
import { AiProjectAnalysis } from './AiProjectAnalysis'

describe('프로젝트 분석', () => {
  it('대표 프로젝트 상세 대신 전체 프로젝트 수행 방식을 요약한다', () => {
    const projects = getAiAnalysis('stu-001').projects
    const analysis = projects.aggregateAnalysis!
    const { container } = render(<AiProjectAnalysis projects={projects} />)

    expect(screen.getByText('프로젝트 분석')).toBeInTheDocument()
    expect(container.querySelector('#ai-project-analysis')).toBeInTheDocument()
    expect(screen.getByText('AI 전체 요약')).toBeInTheDocument()
    expect(screen.getByText('전체 프로젝트에서 주로 한 일')).toBeInTheDocument()
    expect(screen.getByText('주로 맡은 역할')).toBeInTheDocument()
    expect(screen.getByText('주로 맡은 업무')).toBeInTheDocument()
    expect(screen.getByText('프로젝트 기여')).toBeInTheDocument()
    expect(
      screen.getByText(
        `전체 ${analysis.contribution.totalBoardTaskCount}개 중 ${analysis.contribution.assignedTaskCount}개 담당`,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('본인이 작성한 수행·기여에서 반복된 내용'),
    ).toBeInTheDocument()

    expect(screen.queryByText(/대표 프로젝트 0/)).not.toBeInTheDocument()
    expect(screen.queryByText('문제와 판단')).not.toBeInTheDocument()
    expect(screen.queryByText('검증된 결과')).not.toBeInTheDocument()
  })

  it('AI 전체 요약을 두 문장 이상, 세 문장 이하로 표시한다', () => {
    const { container } = render(
      <AiProjectAnalysis projects={getAiAnalysis('stu-001').projects} />,
    )
    const summary = container.querySelector<HTMLElement>(
      '[data-project-analysis-summary]',
    )!
    const lines = within(summary).getAllByText(/.+/, { selector: 'p' })

    expect(lines.length).toBeGreaterThanOrEqual(2)
    expect(lines.length).toBeLessThanOrEqual(3)
  })

  it('동료 평가만 사용한 4축 프로젝트 스타일을 표시한다', () => {
    const projects = getAiAnalysis('stu-001').projects
    const peerAxes = projects.aggregateAnalysis!.peerAxes
    const { container } = render(<AiProjectAnalysis projects={projects} />)

    expect(
      screen.getByText('동료평가 4축으로 본 프로젝트 스타일'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('동료 평가만 사용 · 멘토·강사·운영 평가 제외'),
    ).toBeInTheDocument()
    expect(peerAxes).toHaveLength(4)

    peerAxes.forEach((axis) => {
      const card = container.querySelector(
        `[data-project-peer-axis="${axis.key}"]`,
      )!
      expect(card).toHaveTextContent(axis.key)
      expect(card).toHaveTextContent(`${axis.score!.toFixed(1)} / 5`)
      axis.summary.forEach((line) => expect(card).toHaveTextContent(line))
    })
  })

  it('프로젝트별 성장·확장과 전체 핵심 강점을 표시한다', () => {
    const projects = getAiAnalysis('stu-001').projects
    const analysis = projects.aggregateAnalysis!
    const { container } = render(<AiProjectAnalysis projects={projects} />)

    expect(
      screen.getByText('프로젝트마다 성장하거나 확장한 부분'),
    ).toBeInTheDocument()
    analysis.projectGrowth.forEach((growth) => {
      const card = container.querySelector(
        `[data-project-growth="${growth.projectId}"]`,
      )!
      expect(card).toHaveTextContent(growth.projectName)
      growth.summary.forEach((line) => expect(card).toHaveTextContent(line))
    })

    expect(screen.getByText('핵심 강점')).toBeInTheDocument()
    analysis.strengths.forEach((strength) => {
      expect(screen.getByText(strength)).toBeInTheDocument()
    })
  })

  it('프로젝트 근거가 없으면 빈 패널을 만들지 않는다', () => {
    const projects = {
      ...getAiAnalysis('stu-001').projects,
      projects: [],
    }
    const { container } = render(<AiProjectAnalysis projects={projects} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('각 프로젝트 분석 결과에 실제 보드·기여·역할·동료평가 근거를 연결한다', () => {
    const projects = getAiAnalysis('stu-001').projects
    render(<AiProjectAnalysis projects={projects} />)
    ;[
      'AI 전체 요약',
      '주로 맡은 역할',
      '주로 맡은 업무',
      '프로젝트 기여',
    ].forEach((label) => {
      expect(
        screen.getByRole('button', { name: `${label} 근거 보기` }),
      ).toHaveTextContent('!')
    })
    expect(
      screen.getByRole('button', { name: '프로젝트 핵심 강점 근거 보기' }),
    ).toHaveTextContent('!')
    projects.aggregateAnalysis!.projectGrowth.forEach((growth) => {
      expect(
        screen.getByRole('button', {
          name: `${growth.projectName} 성장·확장 근거 보기`,
        }),
      ).toHaveTextContent('!')
    })
    expect(
      screen.queryByText('분석에 사용한 기본 데이터'),
    ).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: '프로젝트 기여 근거 보기' }),
    )
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('실제 데이터')
    expect(tooltip).toHaveTextContent('분석 흐름')
    expect(tooltip).toHaveTextContent('보드 전체 15개 중 담당 6개 · 완료 6개')
    expect(tooltip).toHaveTextContent('확인 산출물 프로젝트 v0.3 산출물')
    expect(tooltip).toHaveTextContent('전체 보드 중 담당·완료 업무 수를 집계')
  })
})
