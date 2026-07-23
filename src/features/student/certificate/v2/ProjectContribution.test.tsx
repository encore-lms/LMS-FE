import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ProjectContributionActivity } from './ProjectContribution'
import { ProjectContribution } from './ProjectContribution'

const base = {
  period: '2026.04.06 ~ 2026.04.26',
  weeksLabel: '3주',
  certified: false,
  grid: [[1, 0, 0, 0, 0, 0, 0]],
  totalCommits: 1,
  activeDays: 1,
  totalDays: 7,
  longestStreak: 1,
  weeklyAvg: 0.3,
  contrib: '25%',
}

describe('프로젝트 커밋 활동', () => {
  it('MSA 도서 추천 다음에 LMS-FE를 두고 개인 기여율을 표시한다', () => {
    const activities: ProjectContributionActivity[] = [
      {
        ...base,
        id: 'msa',
        name: 'MSA 도서 추천 — 시스템 설계',
      },
      {
        ...base,
        id: 'lms-fe',
        name: 'LMS-FE — 수강역량증명서 프론트엔드',
        weeksLabel: '12주',
        metricLabel: '커밋 기여율',
        metricValue: '27.4%',
      },
    ]

    render(<ProjectContribution activities={activities} />)

    const selectors = screen.getAllByRole('button')
    expect(selectors.map((button) => button.textContent?.trim())).toEqual([
      'MSA 도서 추천',
      'LMS-FE',
    ])

    fireEvent.click(screen.getByRole('button', { name: 'LMS-FE' }))
    expect(screen.getByText('커밋 기여율')).toBeInTheDocument()
    expect(screen.getByText('27.4%')).toBeInTheDocument()
    expect(screen.getAllByText(/12주/)).toHaveLength(2)
    expect(screen.queryByText('최근 내 커밋')).not.toBeInTheDocument()
  })
})
