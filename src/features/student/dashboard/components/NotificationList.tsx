import type { DashboardNotification } from '../types'
import { SectionCard } from './SectionCard'

// 알림 — 본인 관련 이벤트(보완 요청·검토 결과·평판/멘토링 요청 등). 제목+출처 + 상대시간 + 미확인 점.
// 일반 게시판 글 미리보기는 미포함(§2).
export function NotificationList({
  notifications,
}: {
  notifications: DashboardNotification[]
}) {
  const unreadCount = notifications.filter((n) => n.unread).length
  return (
    <SectionCard
      title="알림"
      subtitle={`최근 7일 · 미확인 ${unreadCount}건`}
      action={
        <button
          type="button"
          className="text-fg-subtle hover:text-fg shrink-0 text-xs font-medium"
        >
          모두 읽기 →
        </button>
      }
    >
      {notifications.length === 0 ? (
        <p className="text-fg-subtle py-4 text-center text-sm">알림이 없어요</p>
      ) : (
        <ul className="flex flex-col">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="flex items-start justify-between gap-3 py-2"
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-fg truncate text-sm">{n.title}</span>
                <span className="text-fg-subtle text-xs">{n.source}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {n.unread && (
                  <span className="bg-brand size-1.5 rounded-full" />
                )}
                <span className="text-fg-subtle text-xs">{n.relativeTime}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
