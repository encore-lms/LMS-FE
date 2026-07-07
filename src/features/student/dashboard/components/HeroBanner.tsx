import { CalendarRange, CheckCircle2, Flame } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardAttendance, DashboardHero } from '../types'

// 상단 환영 배너 — 브랜드 그라데이션 위에 인사 + 학습 여정 스탯(연속 출석·출석률·주차) + 진행률 바.
// 게이미피케이션 톤: 오늘의 동기부여 지표를 한눈에(스트릭·출석률·주차), 하단에 과정 진행률.
function StatChip({
  icon: Icon,
  value,
  unit,
  label,
}: {
  icon: LucideIcon
  value: number | string
  unit?: string
  label: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white/12 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur-sm">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <Icon className="size-[17px] text-white" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-bold">
          {value}
          {unit && (
            <span className="ml-0.5 text-[11px] font-semibold text-white/70">
              {unit}
            </span>
          )}
        </span>
        <span className="mt-1 text-[11px] font-medium text-white/70">
          {label}
        </span>
      </span>
    </div>
  )
}

export function HeroBanner({
  hero,
  attendance,
}: {
  hero: DashboardHero
  attendance: DashboardAttendance
}) {
  const { streakDays, attendanceRate } = attendance.summary
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1a8c85_0%,#15807a_52%,#0e6b63_100%)] p-6 text-white shadow-[0_10px_30px_-12px_rgba(26,140,133,0.55)]">
      {/* 장식용 광원 — 깊이감 */}
      <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute top-6 right-40 size-28 rounded-full bg-white/5 blur-xl" />

      <div className="relative flex flex-col gap-5">
        {/* 인사 */}
        <div className="flex flex-col gap-1">
          {hero.todayLabel && (
            <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
              {hero.todayLabel}
            </span>
          )}
          <h2 className="text-2xl font-bold">
            안녕하세요, {hero.studentName}님 👋
          </h2>
          <p className="text-sm text-white/80">
            {hero.courseName} {hero.cohortName} · {hero.currentWeek}/
            {hero.totalWeeks}주차 진행 중
          </p>
        </div>

        {/* 학습 여정 스탯 칩 */}
        <div className="flex flex-wrap gap-3">
          <StatChip
            icon={Flame}
            value={streakDays}
            unit="일"
            label="연속 출석"
          />
          <StatChip
            icon={CheckCircle2}
            value={attendanceRate}
            unit="%"
            label="출석률"
          />
          <StatChip
            icon={CalendarRange}
            value={`${hero.currentWeek}/${hero.totalWeeks}`}
            unit="주"
            label="진행 주차"
          />
        </div>

        {/* 과정 진행률 */}
        <div>
          <div className="mb-1.5 flex items-end justify-between text-sm">
            <span className="font-medium text-white/85">과정 진행률</span>
            <span className="text-lg font-bold">{hero.progressPct}%</span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-valuenow={hero.progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-white/80 to-white shadow-[0_0_12px_rgba(255,255,255,0.5)]"
              style={{ width: `${hero.progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
