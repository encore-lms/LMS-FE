import { useState } from 'react'
import type { HrdAttendanceCalendarData } from '../../types'
import { InfoBanner } from '../InfoBanner'
import { CalendarHeader } from './CalendarHeader'
import { CalendarLegend } from './CalendarLegend'
import { CalendarGrid } from './CalendarGrid'

// HRD-Net 출결 캘린더 섹션 — 헤더(제목·월네비) + 범례 + 단방향 안내 + 월 그리드.
// 월 네비는 FE 상태로 이동(현재 mock은 단월 → 데이터 없는 달은 빈 그리드 + 안내).
// BE 연동 시 view(year/month) 변경에 맞춰 해당 월 데이터를 패치하면 된다.
export function HrdAttendanceCalendar({
  calendar,
}: {
  calendar: HrdAttendanceCalendarData
}) {
  const [view, setView] = useState({
    year: calendar.year,
    month: calendar.month,
  })

  const move = (delta: number) =>
    setView((v) => {
      const m0 = v.month - 1 + delta
      return {
        year: v.year + Math.floor(m0 / 12),
        month: (((m0 % 12) + 12) % 12) + 1,
      }
    })

  const label = `${view.year}년 ${view.month}월`
  const isDataMonth =
    view.year === calendar.year && view.month === calendar.month
  const days = isDataMonth ? calendar.days : []

  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CalendarHeader
          label={label}
          onPrev={() => move(-1)}
          onNext={() => move(1)}
        />
        <CalendarLegend />
      </div>
      <InfoBanner>
        HRD-Net 원본 출결 데이터입니다. 이 화면에서는 수정할 수 없습니다.
        {!isDataMonth && ' · 해당 월 데이터가 없습니다.'}
      </InfoBanner>
      <CalendarGrid year={view.year} month={view.month} days={days} />
    </section>
  )
}
