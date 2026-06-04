import type { HrdAttendanceCalendarData } from '../../types'
import { InfoBanner } from '../InfoBanner'
import { CalendarHeader } from './CalendarHeader'
import { CalendarLegend } from './CalendarLegend'
import { CalendarGrid } from './CalendarGrid'

// HRD-Net 출결 캘린더 섹션 — 헤더(제목·월네비) + 범례 + 단방향 안내 + 월 그리드 조립.
// 월 네비는 mock이 단월이라 비활성(BE 연동 시 onPrev/onNext 주입).
export function HrdAttendanceCalendar({
  calendar,
}: {
  calendar: HrdAttendanceCalendarData
}) {
  const label = `${calendar.year}년 ${calendar.month}월`
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CalendarHeader label={label} />
        <CalendarLegend />
      </div>
      <InfoBanner>
        HRD-Net 원본 출결 데이터입니다. 이 화면에서는 수정할 수 없습니다.
      </InfoBanner>
      <CalendarGrid
        year={calendar.year}
        month={calendar.month}
        days={calendar.days}
      />
    </section>
  )
}
