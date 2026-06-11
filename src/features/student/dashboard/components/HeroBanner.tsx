import type { DashboardHero } from '../types'

// 상단 환영 배너 — 날짜·인사(상단) + 과정/주차·진행률 캡션 + 진행률 바(하단).
// 과정·주차는 곧 진행률(16/24주=67%)과 같은 정보라 진행률 바와 한 줄로 묶는다.
export function HeroBanner({ hero }: { hero: DashboardHero }) {
  return (
    <section className="bg-brand flex flex-col gap-5 rounded-2xl p-6 text-white">
      <div className="flex flex-col gap-1">
        {hero.todayLabel && (
          <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
            {hero.todayLabel}
          </span>
        )}
        <h2 className="text-2xl font-bold">
          안녕하세요, {hero.studentName}님 👋
        </h2>
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-1 text-sm">
          <span className="text-white/80">
            {hero.courseName} {hero.cohortName} · {hero.currentWeek}/
            {hero.totalWeeks}주
          </span>
          <span className="font-medium text-white/90">
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
      </div>
    </section>
  )
}
