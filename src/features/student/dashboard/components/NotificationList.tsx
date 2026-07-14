import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff } from 'lucide-react'
import type { DashboardNotification } from '../types'
import { SectionCard } from './SectionCard'
import { EmptyState } from './EmptyState'

// 알림 — 본인 관련 이벤트(보완 요청·검토 결과·평판/멘토링 요청 등). 제목+출처 + 상대시간 + 미확인 점.
// 일반 게시판 글 미리보기는 미포함(§2).
// 읽음 처리 mutation은 BE 계약 확정 후 — 현재는 로컬 readIds 로 미확인 점을 끈다(헤더 알림 벨과 동일 규약).
export function NotificationList({
  notifications,
}: {
  notifications: DashboardNotification[]
}) {
  const navigate = useNavigate()
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  // 서버 unread 와 로컬 읽음 처리를 합성.
  const rows = notifications.map((n) => ({
    ...n,
    unread: n.unread && !readIds.has(n.id),
  }))
  const unreadCount = rows.filter((n) => n.unread).length
  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)))

  return (
    <SectionCard
      icon={Bell}
      title="알림"
      subtitle={`최근 7일 · 미확인 ${unreadCount}건`}
      action={
        unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="text-fg-subtle hover:text-fg shrink-0 text-xs font-medium"
          >
            모두 읽기 →
          </button>
        ) : null
      }
    >
      {rows.length === 0 ? (
        <EmptyState icon={BellOff} title="새 알림이 없어요" />
      ) : (
        <ul className="flex flex-col">
          {rows.map((n) => {
            const link = n.link
            const rowClass =
              'flex w-full items-start justify-between gap-3 py-2 text-left'
            const content = (
              <>
                <span className="flex min-w-0 flex-col">
                  <span className="text-fg truncate text-sm">{n.title}</span>
                  <span className="text-fg-subtle text-xs">{n.source}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {n.unread && (
                    <span className="bg-brand size-1.5 rounded-full" />
                  )}
                  <span className="text-fg-subtle text-xs">
                    {n.relativeTime}
                  </span>
                </span>
              </>
            )
            return (
              <li key={n.id}>
                {link ? (
                  <button
                    type="button"
                    onClick={() => navigate(link)}
                    className={`hover:bg-surface-muted -mx-2 cursor-pointer rounded-lg px-2 ${rowClass}`}
                  >
                    {content}
                  </button>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
