import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeekRow } from './WeekRow'
import type { CourseWeek } from '../../types'

const base: CourseWeek = {
  weekNo: 14,
  title: '14주차',
  periodStart: '2026-07-28',
  periodEnd: '2026-08-03',
  status: 'learning',
}

describe('WeekRow', () => {
  // 커리큘럼을 올리지 않은 기수는 예전 그대로여야 한다.
  it('커리큘럼이 없으면 주차 번호와 기간만 보여준다', () => {
    render(<WeekRow week={base} />)

    expect(screen.getByText('14주차')).toBeInTheDocument()
    expect(screen.getByText('2026-07-28 — 2026-08-03')).toBeInTheDocument()
  })

  it('커리큘럼이 있으면 교과목을 제목으로, 주제를 한 줄 더 보여준다', () => {
    render(
      <WeekRow
        week={{
          ...base,
          title: 'LLM(초거대언어모델)',
          subjects: ['LLM(초거대언어모델)'],
          topics: ['프롬프트 엔지니어링', '파인튜닝'],
        }}
      />,
    )

    expect(screen.getByText('LLM(초거대언어모델)')).toBeInTheDocument()
    expect(
      screen.getByText('프롬프트 엔지니어링 · 파인튜닝'),
    ).toBeInTheDocument()
    // 제목이 교과목으로 바뀌었으니 주차 번호는 기간 줄에 남는다.
    expect(
      screen.getByText('14주차 · 2026-07-28 — 2026-08-03'),
    ).toBeInTheDocument()
  })

  it('한 주에 교과목이 두 개 걸치면 둘 다 제목에 실린다', () => {
    render(
      <WeekRow
        week={{
          ...base,
          title: '프로그래밍과 데이터 기초 · 데이터 분석과 머신러닝, 딥러닝',
          subjects: [
            '프로그래밍과 데이터 기초',
            '데이터 분석과 머신러닝, 딥러닝',
          ],
          topics: ['단위 프로젝트', '데이터 분석'],
        }}
      />,
    )

    expect(
      screen.getByText(
        '프로그래밍과 데이터 기초 · 데이터 분석과 머신러닝, 딥러닝',
      ),
    ).toBeInTheDocument()
  })
})
