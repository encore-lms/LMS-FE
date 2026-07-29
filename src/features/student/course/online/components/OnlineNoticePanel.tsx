import { Bell } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { OnlineNotice, OnlineNoticeTone } from '../types'

// 우측 학습 공지 패널 — 참고 시안의 'Ai Mentor' 챗 영역을 KDC 맥락(학습 공지)으로 대체.
// 톤(긴급/공지/일반)별 좌측 점 + 태그 배지 + 제목 + 시점.
const TONE: Record<OnlineNoticeTone, { dot: string; badge: string }> = {
  urgent: { dot: 'bg-danger', badge: 'bg-danger-bg text-danger' },
  notice: { dot: 'bg-info', badge: 'bg-info-bg text-info' },
  normal: { dot: 'bg-fg-subtle', badge: 'bg-surface-muted text-fg-muted' },
}

export function OnlineNoticePanel({ notices }: { notices: OnlineNotice[] }) {
  return (
    <section className="bg-surface flex flex-col gap-3.5 rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
      <div className="flex items-center gap-2">
        <span className="bg-brand/10 text-brand flex size-6 items-center justify-center rounded-md">
          <Bell className="size-3.5" />
        </span>
        <h3 className="text-fg text-[15px] font-bold">학습 공지</h3>
        <span className="bg-surface-muted text-fg-muted ml-auto rounded-md px-2 py-0.5 text-[11px] font-bold">
          {notices.length}
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {notices.map((n) => {
          const tone = TONE[n.tone]
          return (
            <li
              key={n.id}
              className="hover:bg-surface-muted -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-2.5"
            >
              <span
                className={cn('mt-1.5 size-2 shrink-0 rounded-full', tone.dot)}
              />
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold',
                      tone.badge,
                    )}
                  >
                    {n.tagLabel}
                  </span>
                  <span className="text-fg-subtle text-[10px]">
                    {n.timeAgo}
                  </span>
                </div>
                <span className="text-fg text-[13px] leading-snug font-medium">
                  {n.title}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
