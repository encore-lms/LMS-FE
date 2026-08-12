import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import type { CourseMiniCard, CourseMiniTone } from '../../types'

// 강의 홈 우측 미니 리스트 카드 — 미응시 퀴즈 / 마감 임박 과제 / 새 자료.
// 헤더(톤 점 + 제목 + 카운트 배지 + 액션) + 행 목록(행 사이 디바이더). 카드 key로 대상 화면 연결.
const TONE: Record<CourseMiniTone, { dot: string; badge: string }> = {
  warning: { dot: 'bg-warning', badge: 'bg-warning-bg text-warning' },
  danger: { dot: 'bg-danger', badge: 'bg-danger-bg text-danger' },
  info: { dot: 'bg-info', badge: 'bg-info-bg text-info' },
}

// key → 수강생 이동 경로. 없는 key는 비활성(이동 안 함).
const KEY_ROUTE: Record<string, string> = {
  quiz: '/student/quizzes',
  assignment: '/student/course/assignments',
  material: '/student/course/materials',
}

/** 운영·강사가 같은 카드를 볼 때 갈 곳 — 허브의 해당 탭. */
const KEY_TAB: Record<string, string> = {
  quiz: 'quizzes',
  assignment: 'assignments',
  material: 'materials',
}

function rowBadgeClass(badge: string) {
  if (badge.includes('→')) return 'bg-surface-muted text-brand'
  return 'bg-warning-bg text-warning'
}

export function MiniListCard({
  card,
  hubTo,
}: {
  card: CourseMiniCard
  /**
   * 운영·강사가 볼 때의 허브 경로 — 주면 이 카드는 그 허브의 탭으로 간다.
   *
   * <p>예전에는 수강생 경로가 박혀 있어, 매니저가 누르면 권한 가드에 막혀 대시보드로
   * 튕겼다(2026-08-05 QA).</p>
   */
  hubTo?: (tab: string) => string
}) {
  const tone = TONE[card.tone]
  const tab = KEY_TAB[card.key]
  const to = hubTo ? (tab ? hubTo(tab) : undefined) : KEY_ROUTE[card.key]
  return (
    <section className="bg-surface flex w-full flex-col gap-3 rounded-[14px] p-[18px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', tone.dot)} />
          <h3 className="text-fg text-[13px] font-bold">{card.title}</h3>
          <span
            className={cn(
              'rounded-[5px] px-1.5 py-0.5 text-[11px] font-bold',
              tone.badge,
            )}
          >
            {card.count}
          </span>
        </div>
        {to ? (
          <Link to={to} className="text-brand text-[11px] font-semibold">
            {card.action}
          </Link>
        ) : (
          <span className="text-fg-subtle text-[11px] font-semibold">
            {card.action}
          </span>
        )}
      </div>
      {card.rows.map((row, i) => (
        <Fragment key={row.id}>
          {i > 0 && <div className="bg-divider h-px w-full" />}
          {to ? (
            <Link
              to={to}
              className="hover:bg-surface-muted -mx-2 flex w-full flex-col gap-1 rounded-lg px-2 py-1"
            >
              <RowBody row={row} />
            </Link>
          ) : (
            <div className="flex w-full flex-col gap-1">
              <RowBody row={row} />
            </div>
          )}
        </Fragment>
      ))}
    </section>
  )
}

function RowBody({ row }: { row: CourseMiniCard['rows'][number] }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-fg truncate text-[12px] font-semibold"
          title={row.title}
        >
          {row.title}
        </span>
        {row.badge && (
          <span
            className={cn(
              'shrink-0 rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold',
              rowBadgeClass(row.badge),
            )}
          >
            {row.badge}
          </span>
        )}
      </div>
      {row.meta && (
        <span className="text-fg-muted text-[11px]">{row.meta}</span>
      )}
    </>
  )
}
