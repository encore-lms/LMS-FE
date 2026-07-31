import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarDayCell } from './CalendarDayCell'

// QA: "출결폼을 작성해도 캘린더에 기입되지 않는다. 작성하지 않았을 때 미제출 표시 필요."
// 폼은 HRD 출결과 별개 데이터라 캘린더에 아무 흔적이 없었다.

describe('CalendarDayCell (출결 폼 표시)', () => {
  it('사유가 필요한 날에 폼을 냈으면 제출로 표시한다', () => {
    render(
      <CalendarDayCell day={29} inMonth status="LATE" formSubmitted />,
    )
    expect(screen.getByText('폼 제출')).toBeInTheDocument()
  })

  it('사유가 필요한 날에 폼이 없으면 미제출로 표시한다', () => {
    render(<CalendarDayCell day={29} inMonth status="ABSENT" />)
    expect(screen.getByText('폼 미제출')).toBeInTheDocument()
  })

  // 정상 출석한 날까지 '미제출'이 뜨면 달력이 경고로 뒤덮인다.
  it('정상 출석·데이터 없는 날에는 아무것도 붙이지 않는다', () => {
    const { rerender } = render(
      <CalendarDayCell day={1} inMonth status="PRESENT" />,
    )
    expect(screen.queryByText(/폼/)).not.toBeInTheDocument()

    rerender(<CalendarDayCell day={2} inMonth status={null} />)
    expect(screen.queryByText(/폼/)).not.toBeInTheDocument()
  })

  it('당월 밖 날짜에는 표시하지 않는다', () => {
    render(<CalendarDayCell day={31} inMonth={false} status="LATE" />)
    expect(screen.queryByText(/폼/)).not.toBeInTheDocument()
  })
})
