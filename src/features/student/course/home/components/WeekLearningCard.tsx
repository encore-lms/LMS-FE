import type { CourseWeek } from '../../types'
import { WeekRow } from './WeekRow'

// 주차별 학습 카드(좌측) — 제목/부제 + '전체 주차 보기' + 주차 행 목록.
export function WeekLearningCard({
  title,
  subtitle,
  weeks,
}: {
  title: string
  subtitle: string
  weeks: CourseWeek[]
}) {
  return (
    <section className="border-border bg-surface flex flex-1 flex-col gap-3.5 rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-fg text-[15px] font-bold">{title}</h2>
          <p className="text-fg-muted text-[11px]">{subtitle}</p>
        </div>
        <button
          type="button"
          className="text-brand shrink-0 text-[12px] font-semibold"
        >
          전체 주차 보기 →
        </button>
      </div>
      {weeks.map((w) => (
        <WeekRow key={w.weekNo} week={w} />
      ))}
    </section>
  )
}
