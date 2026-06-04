import type { DashboardNotification } from '../types'
import { SectionCard } from './SectionCard'

// 알림 — 본인 관련 이벤트(보완 요청·검토 결과·평판/멘토링 요청 등). 일반 게시판 글 미리보기는 미포함(§2).
export function NotificationList({
  notifications,
}: {
  notifications: DashboardNotification[]
}) {
  return (
    <SectionCard title="알림">
      {notifications.length === 0 ? (
        <p className="text-fg-subtle py-4 text-center text-sm">알림이 없어요</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="flex items-center justify-between gap-3 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="bg-accent size-1.5 shrink-0 rounded-full" />
                <span className="text-fg truncate text-sm">{n.title}</span>
              </span>
              <span className="text-fg-subtle shrink-0 text-xs">{n.date}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
