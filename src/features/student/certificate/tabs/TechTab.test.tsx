import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CertificateTechDetail } from '../ai'
import { AssessmentTrendChart } from './TechTab'

const assessments: CertificateTechDetail['assessments'] = [
  {
    id: 'quiz-1',
    title: 'SKN 4기 파이썬 기초 성취도평가',
    assessmentType: 'ACHIEVEMENT',
    category: '파이썬',
    score: 92,
    cohortAverageScore: 86,
    relativeScore: 78.5,
    comparisonCount: 36,
    submittedAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'quiz-2',
    title: 'SQL 활용 성취도평가',
    assessmentType: 'ACHIEVEMENT',
    category: 'SQL',
    score: 84,
    cohortAverageScore: 88,
    relativeScore: 80.5,
    comparisonCount: 35,
    submittedAt: '2026-04-02T10:00:00Z',
  },
]

describe('AssessmentTrendChart', () => {
  it('확정 형식의 단일 시험 추세와 평균 기준 색상을 표시한다', () => {
    const { container } = render(
      <AssessmentTrendChart
        assessments={assessments}
        averageTopPercent={18}
        averagePopulationSize={36}
      />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getByText(/2회 평가 기록 · 평균\s*88점/)).toBeInTheDocument()
    expect(screen.getByText('성취도 평가 · 평균 미만')).toBeInTheDocument()
    expect(screen.getByText('성취도 평가 · 평균 이상')).toBeInTheDocument()
    expect(screen.getByText(/상위 18%/)).toBeInTheDocument()
    expect(screen.getByText('시험별 기수 평균')).toBeInTheDocument()
    expect(screen.getByText('파이썬 기초')).toBeInTheDocument()
    expect(screen.getByText('SQL 활용')).toBeInTheDocument()
    expect(screen.getByText('2026.03.18')).toBeInTheDocument()
    expect(screen.getByText('2026.04.02')).toBeInTheDocument()
    expect(screen.queryByText(/^Q[12]$/)).not.toBeInTheDocument()
    expect(screen.getByText(/최근 5회 절대 평균\s*88.0점/)).toHaveTextContent(
      '유효 2회 · +0.0점',
    )
    expect(
      container.querySelector('[data-assessment-average-line]'),
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('[data-assessment-average-marker="quiz-1"]'),
    ).toHaveStyle({ bottom: '86%' })
    expect(
      container.querySelector('[data-assessment-average-stroke="quiz-1"]'),
    ).toHaveClass('border-danger', 'border-t-2')
    expect(
      container.querySelector('[data-assessment-average-marker="quiz-2"]'),
    ).toHaveStyle({ bottom: '88%' })
    expect(container.querySelectorAll('[data-assessment-bar]')).toHaveLength(2)
    expect(
      container.querySelector('[data-assessment-bar="quiz-1"]'),
    ).toHaveClass('from-accent-strong', 'to-brand')
    expect(
      container.querySelector('[data-assessment-bar="quiz-1"]'),
    ).toHaveAttribute('data-average-position', 'above')
    expect(
      container.querySelector('[data-assessment-bar="quiz-2"]'),
    ).toHaveClass('bg-accent-bg', 'border-accent-strong/30')
    expect(
      container.querySelector('[data-assessment-bar="quiz-2"]'),
    ).toHaveAttribute('data-average-position', 'below')

    const firstAverage = container.querySelector(
      '[data-assessment-average-marker="quiz-1"]',
    ) as HTMLElement
    fireEvent.mouseEnter(firstAverage)
    const averageTooltip = container.querySelector(
      '[data-assessment-average-tooltip="quiz-1"]',
    )
    expect(averageTooltip).toHaveTextContent('SKN 4기 파이썬 기초 성취도평가')
    expect(averageTooltip).toHaveTextContent('파이썬')
    expect(averageTooltip).toHaveTextContent('파이썬 · 기수 평균')
    expect(averageTooltip).toHaveTextContent('평균 점수86점')
    expect(averageTooltip).toHaveTextContent('비교 표본 36명')
    fireEvent.mouseLeave(firstAverage)
    expect(
      container.querySelector('[data-assessment-average-tooltip="quiz-1"]'),
    ).not.toBeInTheDocument()
  })

  it('실제 점수를 선으로 잇고 점 호버 시 직전 시험 대비 변화를 표시한다', () => {
    const { container, rerender } = render(
      <AssessmentTrendChart
        assessments={assessments}
        averageTopPercent={18}
        averagePopulationSize={36}
      />,
    )

    expect(
      container.querySelector('[data-assessment-trend-line]'),
    ).toHaveAttribute('d', expect.stringContaining('C'))
    expect(container.querySelector('[data-assessment-trend-line]')).toHaveClass(
      'stroke-accent-strong',
    )
    expect(
      container.querySelectorAll('[data-assessment-trend-point]'),
    ).toHaveLength(2)

    const firstPoint = container.querySelector(
      '[data-assessment-trend-point="quiz-1"]',
    ) as HTMLElement
    const firstBar = container.querySelector(
      '[data-assessment-bar="quiz-1"]',
    ) as HTMLElement
    fireEvent.mouseMove(firstBar, { clientX: 160, clientY: 120 })
    const subjectTooltip = container.querySelector(
      '[data-assessment-subject-tooltip="quiz-1"]',
    )
    expect(subjectTooltip).toHaveTextContent('파이썬 기초')
    expect(subjectTooltip).toHaveTextContent('92점')
    expect(subjectTooltip).not.toHaveTextContent('SKN 4기')
    expect(subjectTooltip).not.toHaveTextContent('성취도평가')
    expect(subjectTooltip).not.toHaveTextContent('Q1')
    fireEvent.mouseLeave(firstBar)
    expect(
      container.querySelector('[data-assessment-subject-tooltip="quiz-1"]'),
    ).not.toBeInTheDocument()
    fireEvent.mouseMove(
      container.querySelector('[data-assessment-chart-area]') as HTMLElement,
      { clientX: 160, clientY: 40 },
    )
    expect(
      container.querySelector('[data-assessment-subject-tooltip]'),
    ).not.toBeInTheDocument()

    fireEvent.mouseEnter(firstPoint)
    expect(
      container.querySelector('[data-assessment-trend-comparison="quiz-1"]'),
    ).toHaveTextContent('첫 시험 · 비교 기준 없음')
    expect(
      container.querySelector('[data-assessment-trend-comparison="quiz-1"]'),
    ).toHaveTextContent('SKN 4기 파이썬 기초 성취도평가')
    fireEvent.mouseLeave(firstPoint)

    const secondPoint = container.querySelector(
      '[data-assessment-trend-point="quiz-2"]',
    ) as HTMLElement
    fireEvent.mouseEnter(secondPoint)
    const fallingComparison = container.querySelector(
      '[data-assessment-trend-comparison="quiz-2"]',
    )
    expect(fallingComparison).toHaveAttribute(
      'data-comparison-direction',
      'down',
    )
    expect(fallingComparison?.textContent?.indexOf('직전 시험')).toBeLessThan(
      fallingComparison?.textContent?.indexOf('현재 시험') ?? 0,
    )
    expect(fallingComparison).toHaveTextContent('▼8점')
    expect(container.querySelector('[data-assessment-chart-area]')).toHaveClass(
      'z-auto',
    )
    fireEvent.mouseLeave(secondPoint)

    rerender(
      <AssessmentTrendChart
        assessments={[assessments[1], assessments[0]]}
        averageTopPercent={18}
        averagePopulationSize={36}
      />,
    )
    const risingPoint = container.querySelector(
      '[data-assessment-trend-point="quiz-1"]',
    ) as HTMLElement
    fireEvent.mouseEnter(risingPoint)
    const risingComparison = container.querySelector(
      '[data-assessment-trend-comparison="quiz-1"]',
    )
    expect(risingComparison).toHaveAttribute('data-comparison-direction', 'up')
    expect(risingComparison).toHaveTextContent('▲8점')
  })

  it('CS 평가는 정보색 계열 안에서 평균 이상과 미만의 농도를 구분한다', () => {
    const { container } = render(
      <AssessmentTrendChart
        assessments={assessments.map((assessment) => ({
          ...assessment,
          assessmentType: 'CS' as const,
        }))}
        averageTopPercent={18}
        averagePopulationSize={36}
        tone="cs"
      />,
    )

    expect(
      container.querySelector('[data-assessment-trend-tone="cs"]'),
    ).toBeInTheDocument()
    expect(container.querySelector('[data-assessment-trend-line]')).toHaveClass(
      'stroke-info',
    )
    expect(
      container.querySelector('[data-assessment-bar="quiz-1"]'),
    ).toHaveClass('from-info', 'to-info/65')
    expect(
      container.querySelector('[data-assessment-bar="quiz-2"]'),
    ).toHaveClass('bg-info-bg', 'border-info/30')
    expect(screen.getByText('CS 평가 · 평균 이상')).toBeInTheDocument()
    expect(screen.getByText('CS 평가 · 평균 미만')).toBeInTheDocument()
  })
})
