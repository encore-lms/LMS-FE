import type { CourseHero as CourseHeroType } from '../../types'

// 강의 홈 히어로 — 과정/기수·교육기간·진행률. 히어로 배경은 brand 단색 통일(SSOT).
export function CourseHero({ hero }: { hero: CourseHeroType }) {
  return (
    <section className="bg-brand flex w-full flex-col gap-[18px] rounded-2xl p-6 text-white shadow-[0px_8px_22px_0px_rgba(26,140,133,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-white/90">
            {hero.trackLabel}
          </span>
          <h2 className="text-2xl font-bold">
            {hero.courseName} · {hero.cohortName}
          </h2>
          <div className="flex items-center gap-2.5 text-[13px] font-medium text-white/90">
            <span>
              교육 기간 {hero.periodStart} — {hero.periodEnd}
            </span>
            <span className="size-1 rounded-full bg-white/90" />
            <span>
              {hero.currentWeek}주차 / {hero.totalWeeks}주 진행 중
            </span>
          </div>
        </div>
        <div className="bg-surface flex flex-col items-center justify-center gap-0.5 rounded-[10px] px-4 py-2 text-center">
          <span className="text-fg-muted text-[10px] tracking-[0.08em]">
            진행률
          </span>
          <span className="text-brand text-lg font-bold">
            {hero.progressPct}%
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <div className="flex w-full items-start justify-between text-white">
          <span className="text-[12px] font-medium">{hero.progressLabel}</span>
          <span className="text-[11px]">{hero.progressSubLabel}</span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-white/25"
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
