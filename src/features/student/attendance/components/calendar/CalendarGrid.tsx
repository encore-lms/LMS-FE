import type { HrdAttendanceDay, HrdAttendanceStatus } from '../../types'
import { CalendarDayCell } from './CalendarDayCell'

// 월 단위 그리드 — 6주(42칸) 고정. 당월 전후 넘침 날짜도 숫자로 채우되 상태 배지는 당월만.
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => String(n).padStart(2, '0')

interface CalendarGridProps {
  year: number
  month: number // 1~12
  days: HrdAttendanceDay[]
  today?: string // YYYY-MM-DD — 당일 셀 강조
  /** 출결 폼을 낸 날짜들 — 사유가 필요한 날에 제출 여부를 표시한다. */
  formDates?: Set<string>
}

export function CalendarGrid({
  year,
  month,
  days,
  today,
  formDates,
}: CalendarGridProps) {
  const statusByDate = new Map<string, HrdAttendanceStatus | null>(
    days.map((d) => [d.date, d.status]),
  )
  const start = new Date(year, month - 1, 1).getDay() // 0=일
  const daysInMonth = new Date(year, month, 0).getDate()
  const prevMonthDays = new Date(year, month - 1, 0).getDate()

  const cells = Array.from({ length: 42 }, (_, i) => {
    const offset = i - start + 1
    if (offset < 1) {
      return {
        key: `prev-${i}`,
        day: prevMonthDays + offset,
        inMonth: false,
        status: null as HrdAttendanceStatus | null,
        isToday: false,
      }
    }
    if (offset > daysInMonth) {
      return {
        key: `next-${i}`,
        day: offset - daysInMonth,
        inMonth: false,
        status: null as HrdAttendanceStatus | null,
        isToday: false,
      }
    }
    const date = `${year}-${pad(month)}-${pad(offset)}`
    return {
      key: date,
      day: offset,
      inMonth: true,
      status: statusByDate.get(date) ?? null,
      isToday: !!today && date === today,
    }
  })

  return (
    <div className="border-border overflow-hidden rounded-lg border-r border-b">
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="border-border bg-surface-muted text-fg-muted border-t border-l py-2 text-center text-xs font-medium"
          >
            {w}
          </div>
        ))}
        {cells.map((c) => (
          <CalendarDayCell
            key={c.key}
            day={c.day}
            inMonth={c.inMonth}
            status={c.status}
            isToday={c.isToday}
            formSubmitted={c.inMonth && !!formDates?.has(c.key)}
          />
        ))}
      </div>
    </div>
  )
}
