import { Flame } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { DashboardAttendance, DashboardAttendanceStatus } from '../types'
import { SectionCard } from './SectionCard'

// 주간 스트릭 — 이번 주 7일 칩(일~토). 출석=브랜드 채움 · 지각/조퇴/외출=옐로 · 결석=레드,
// 오늘은 링 강조, 아직 안 온 날·주말은 무지 칩. 참고 디자인(Weekly Streak)의 요일 칩 감성.
const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토']

const CHIP: Record<DashboardAttendanceStatus, string> = {
  PRESENT: 'bg-brand text-white',
  LATE: 'bg-warning-bg text-warning',
  EARLY_LEAVE: 'bg-info-bg text-info',
  OUTING: 'bg-accent-bg text-accent-strong',
  ABSENT: 'bg-danger-bg text-danger',
}

const pad = (n: number) => String(n).padStart(2, '0')

export function WeeklyStreak({
  attendance,
}: {
  attendance: DashboardAttendance
}) {
  const { calendar, summary } = attendance
  if (!calendar.today) return null

  // 오늘이 속한 주(일요일 시작)의 7일을 도출한다.
  const [y, m, d] = calendar.today.split('-').map(Number)
  const todayDate = new Date(y, m - 1, d)
  const sunday = new Date(todayDate)
  sunday.setDate(todayDate.getDate() - todayDate.getDay())
  const statusByDate = new Map(calendar.days.map((v) => [v.date, v.status]))

  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + i)
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    return {
      key,
      label: DAY_LABEL[i],
      day: date.getDate(),
      status: statusByDate.get(key) ?? null,
      isToday: key === calendar.today,
    }
  })

  return (
    <SectionCard
      icon={Flame}
      title="주간 스트릭"
      subtitle={`연속 출석 ${summary.streakDays}일 진행 중`}
    >
      <div className="grid grid-cols-7 gap-1.5">
        {week.map((w) => (
          <div key={w.key} className="flex flex-col items-center gap-1">
            <span className="text-fg-subtle text-[10px] font-medium">
              {w.label}
            </span>
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-[10px] text-[13px] font-bold transition-colors',
                w.status
                  ? CHIP[w.status]
                  : 'bg-surface-muted text-fg-subtle font-medium',
                w.isToday && 'ring-brand ring-2 ring-offset-1',
              )}
            >
              {w.day}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
