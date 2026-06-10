import type { DashboardHero } from '../types'

// 상단 환영 배너 — 과정/기수/주차 + 진행률 바. (증명서 위젯은 §2상 대시보드 제외)
export function HeroBanner({ hero }: { hero: DashboardHero }) {
  return (
    <section className="bg-brand flex flex-col gap-4 rounded-2xl p-6 text-white">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-white/80">
            {hero.courseName} {hero.cohortName} · {hero.currentWeek}/
            {hero.totalWeeks}주
          </span>
          <h2 className="text-2xl font-bold">
            안녕하세요, {hero.studentName}님 👋
          </h2>
        </div>
        <span className="text-sm font-medium text-white/90">
          진행률 {hero.progressPct}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/25"
        role="progressbar"
        aria-valuenow={hero.progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${hero.progressPct}%` }}
        />
      </div>
    </section>
  )
}
