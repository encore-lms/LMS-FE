import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CourseWeek } from '../../types'
import { WeekRow } from './WeekRow'

// 주차별 학습 카드(좌측) — 제목/부제 + '전체 주차 보기' + 주차 행 목록.
// 카드에는 현재 주차 n 기준 n-2 ~ n+2(최대 5주)만 노출한다.
// allWeeksHref가 있으면(수강생) '전체 주차 보기'가 그 경로로 이동하고,
// 없으면(강사·운영 허브 — 이동할 수강생 라우트가 없다) 카드 안에서 전체 주차를 펼친다.
export function WeekLearningCard({
  title,
  subtitle,
  weeks,
  currentWeek,
  allWeeksHref,
}: {
  title: string
  subtitle: string
  weeks: CourseWeek[]
  currentWeek: number
  allWeeksHref?: string
}) {
  const [showAll, setShowAll] = useState(false)
  const visibleWeeks = showAll
    ? weeks
    : weeks.filter(
        (w) => w.weekNo >= currentWeek - 2 && w.weekNo <= currentWeek + 2,
      )
  return (
    <section className="bg-surface flex flex-1 flex-col gap-3.5 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-fg text-[15px] font-bold">{title}</h2>
          <p className="text-fg-muted text-[11px]">{subtitle}</p>
        </div>
        {allWeeksHref ? (
          <Link
            to={allWeeksHref}
            className="text-brand shrink-0 text-[12px] font-semibold"
          >
            전체 주차 보기 →
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-brand shrink-0 text-[12px] font-semibold"
          >
            {showAll ? '현재 주차만 보기 ←' : '전체 주차 보기 →'}
          </button>
        )}
      </div>
      {visibleWeeks.map((w) => (
        <WeekRow key={w.weekNo} week={w} />
      ))}
    </section>
  )
}
