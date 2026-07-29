import { CalendarCheck, Coins } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useMileageOverview } from '../../api/mileage'
import type { DashboardAttendance, DashboardHero } from '../types'

// 우측 레일 프로필 카드 — 아바타(이니셜)+이름+과정·기수 + 스탯(누적 출석·마일리지).
// 마일리지는 과정에 따라 미사용일 수 있으므로 조회 성공 시에만 표시한다(실패·미구현이면 숨김).
export function ProfileCard({
  hero,
  attendance,
}: {
  hero: DashboardHero
  attendance: DashboardAttendance
}) {
  const mileage = useMileageOverview()
  const { presentDays, totalDays } = attendance.summary
  const initial = hero.studentName.charAt(0)
  const showMileage = mileage.isSuccess && !!mileage.data?.balance
  // 잔액 0이면 옐로 강조가 어색하므로 무지 톤으로 낮춘다(획득 전 신규 수강생).
  const hasBalance =
    showMileage && mileage.data.balance.replace(/[^0-9]/g, '') !== '0'

  return (
    <section className="border-border/70 bg-surface flex flex-col gap-4 rounded-2xl border p-5 shadow-[0px_2px_10px_0px_rgba(18,23,38,0.04)] transition-shadow duration-200 hover:shadow-[0px_6px_20px_0px_rgba(18,23,38,0.09)]">
      {/* 아바타 + 이름 + 소속 */}
      <div className="flex items-center gap-3">
        <span className="bg-brand ring-brand/20 flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ring-4">
          {initial}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-fg truncate text-[15px] font-bold">
            {hero.studentName}
          </span>
          <span className="text-fg-subtle truncate text-xs">
            {hero.courseName} {hero.cohortName}
          </span>
        </div>
      </div>

      {/* 스탯 — 누적 출석(항상) · 마일리지(사용 과정만) */}
      <div className="border-divider grid grid-cols-2 gap-2 border-t pt-4">
        <div className="bg-surface-muted flex flex-col items-center gap-0.5 rounded-lg px-2 py-2.5">
          <span className="text-fg-muted flex items-center gap-1 text-[11px] font-medium">
            <CalendarCheck className="size-3.5" />
            누적 출석
          </span>
          <span className="text-fg text-[15px] font-bold">
            {presentDays}
            <span className="text-fg-subtle text-[11px] font-medium">
              /{totalDays}일
            </span>
          </span>
        </div>
        {showMileage ? (
          <Link
            to="/student/mileage"
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-2 py-2.5 transition-colors',
              hasBalance
                ? 'bg-warning-bg hover:bg-warning-bg/70'
                : 'bg-surface-muted hover:bg-surface-muted/70',
            )}
          >
            <span
              className={cn(
                'flex items-center gap-1 text-[11px] font-medium',
                hasBalance ? 'text-warning' : 'text-fg-muted',
              )}
            >
              <Coins className="size-3.5" />
              마일리지
            </span>
            <span className="text-fg text-[15px] font-bold">
              {mileage.data.balance}
              <span className="text-fg-subtle text-[11px] font-medium">M</span>
            </span>
          </Link>
        ) : (
          <div className="bg-surface-muted flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2.5">
            <span className="text-fg-muted text-[11px] font-medium">
              출석률
            </span>
            <span className="text-fg text-[15px] font-bold">
              {attendance.summary.attendanceRate}
              <span className="text-fg-subtle text-[11px] font-medium">%</span>
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
