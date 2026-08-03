import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { WeekLearningCard } from './WeekLearningCard'
import type { CourseWeek } from '../../types'

// 1~10주차 — 현재 주차 5 기준 카드에는 3~7주차(±2)만 실린다.
const weeks: CourseWeek[] = Array.from({ length: 10 }, (_, i) => ({
  weekNo: i + 1,
  title: `${i + 1}주차`,
  periodStart: '2026-07-01',
  periodEnd: '2026-07-07',
  status: i + 1 < 5 ? 'done' : i + 1 === 5 ? 'learning' : 'upcoming',
}))

const baseProps = {
  title: '주차별 학습',
  subtitle: '이번 주 학습을 확인하세요',
  weeks,
  currentWeek: 5,
}

describe('WeekLearningCard', () => {
  it('현재 주차 ±2 범위만 보여준다', () => {
    render(
      <MemoryRouter>
        <WeekLearningCard
          {...baseProps}
          allWeeksHref="/student/course/materials"
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('3주차')).toBeInTheDocument()
    expect(screen.getByText('7주차')).toBeInTheDocument()
    expect(screen.queryByText('2주차')).not.toBeInTheDocument()
    expect(screen.queryByText('8주차')).not.toBeInTheDocument()
  })

  it('allWeeksHref가 있으면(수강생) 링크로 이동한다', () => {
    render(
      <MemoryRouter>
        <WeekLearningCard
          {...baseProps}
          allWeeksHref="/student/course/materials"
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: '전체 주차 보기 →' }),
    ).toHaveAttribute('href', '/student/course/materials')
  })

  // 강사·운영 허브 — 수강생 라우트로 이동할 수 없으니 카드 안에서 전체 주차를 펼친다.
  it('allWeeksHref가 없으면 버튼으로 전체 주차를 펼치고 다시 접는다', async () => {
    const user = userEvent.setup()
    render(<WeekLearningCard {...baseProps} />)

    const toggle = screen.getByRole('button', { name: '전체 주차 보기 →' })
    expect(screen.queryByText('1주차')).not.toBeInTheDocument()

    await user.click(toggle)
    expect(screen.getByText('1주차')).toBeInTheDocument()
    expect(screen.getByText('10주차')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '현재 주차만 보기 ←' }))
    expect(screen.queryByText('1주차')).not.toBeInTheDocument()
    expect(screen.getByText('5주차')).toBeInTheDocument()
  })
})
