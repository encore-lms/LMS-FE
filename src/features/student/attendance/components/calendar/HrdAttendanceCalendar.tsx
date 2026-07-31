import type { HrdAttendanceCalendarData } from '../../types'
import { InfoBanner } from '../InfoBanner'
import { CalendarHeader } from './CalendarHeader'
import { CalendarLegend } from './CalendarLegend'
import { CalendarGrid } from './CalendarGrid'

// HRD-Net 출결 캘린더 — 헤더(제목·월네비) + 범례 + 안내 + 월 그리드.
// 월 네비는 상위(AttendanceView)에 위임: onMove(year, month) → 해당 월 재조회.
export function HrdAttendanceCalendar({
  calendar,
  onMove,
  formDates,
}: {
  calendar: HrdAttendanceCalendarData
  onMove: (year: number, month: number) => void
  /** 출결 폼을 낸 날짜들 — 사유가 필요한 날에 제출 여부를 표시한다. */
  formDates?: Set<string>
}) {
  const move = (delta: number) => {
    const m0 = calendar.month - 1 + delta
    onMove(calendar.year + Math.floor(m0 / 12), (((m0 % 12) + 12) % 12) + 1)
  }

  const label = `${calendar.year}년 ${calendar.month}월`

  return (
    <section className="bg-surface flex flex-col gap-4 rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CalendarHeader
          label={label}
          onPrev={() => move(-1)}
          onNext={() => move(1)}
        />
        <CalendarLegend />
      </div>
      <InfoBanner>
        HRD-Net 원본 출결 데이터입니다. 이 화면에서는 수정할 수 없습니다. 지각·결석·조퇴·외출인
        날에는 출결 폼 제출 여부를 함께 표시합니다.
      </InfoBanner>
      <CalendarGrid
        year={calendar.year}
        month={calendar.month}
        days={calendar.days}
        today={calendar.today}
        formDates={formDates}
      />
    </section>
  )
}
