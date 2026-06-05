import { Fragment } from 'react'
import { cn } from '@/shared/lib/cn'
import type { CourseMiniCard, CourseMiniTone } from '../../types'

// 강의 홈 우측 미니 리스트 카드 — 미응시 퀴즈 / 마감 임박 과제 / 새 자료.
// 헤더(톤 점 + 제목 + 카운트 배지 + 액션) + 행 목록(행 사이 디바이더).
const TONE: Record<CourseMiniTone, { dot: string; badge: string }> = {
  warning: { dot: 'bg-warning', badge: 'bg-warning-bg text-warning' },
  danger: { dot: 'bg-danger', badge: 'bg-danger-bg text-danger' },
  info: { dot: 'bg-info', badge: 'bg-info-bg text-info' },
}

function rowBadgeClass(badge: string) {
  if (badge.includes('→')) return 'bg-surface-muted text-brand'
  return 'bg-warning-bg text-warning'
}

export function MiniListCard({ card }: { card: CourseMiniCard }) {
  const tone = TONE[card.tone]
  return (
    <section className="border-border bg-surface flex w-full flex-col gap-3 rounded-[14px] border p-[18px] shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
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
        <button type="button" className="text-brand text-[11px] font-semibold">
          {card.action}
        </button>
      </div>
      {card.rows.map((row, i) => (
        <Fragment key={row.id}>
          {i > 0 && <div className="bg-divider h-px w-full" />}
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-fg text-[12px] font-semibold">
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
          </div>
        </Fragment>
      ))}
    </section>
  )
}
