import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff } from 'lucide-react'
import {
  useMarkNotificationRead,
  useMarkNotificationsRead,
} from '@/shared/api/notifications'
import type { DashboardNotification } from '../types'
import { dashboardKeys } from '../queryKeys'
import { SectionCard } from './SectionCard'
import { EmptyState } from './EmptyState'

// 알림 — 본인 관련 이벤트(보완 요청·검토 결과·QnA 답변·멘토링 등). 제목+출처 + 상대시간 + 미확인 점.
// 대시보드에는 최신 5건만(BE가 잘라 내려준다) — 전체는 '전체 보기'로 알림 화면에서 본다.
// 헤더 알림 벨과 같은 알림(동일 id)이라 읽음도 서버에 영속한다(로컬 표시가 아니라 새로고침해도 유지).
// 클릭 = 확인 → 해당 알림 읽음 처리 후 link로 이동. 대시보드 응답이 알림을 품고 있어 함께 무효화한다.
const DASHBOARD_LIMIT = 5

export function NotificationList({
  notifications,
}: {
  notifications: DashboardNotification[]
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const markOneRead = useMarkNotificationRead()
  const markAllRead = useMarkNotificationsRead()

  // BE가 이미 5건으로 잘라 내려주지만, 목록이 대시보드를 덮지 않도록 화면에서도 한 번 더 막는다.
  const visible = notifications.slice(0, DASHBOARD_LIMIT)
  const unreadCount = visible.filter((n) => n.unread).length
  // 알림 읽음은 대시보드 응답(notifications)에도 반영돼야 하므로 대시보드 쿼리도 무효화.
  const refreshDashboard = () =>
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all })

  return (
    <SectionCard
      icon={Bell}
      title="알림"
      subtitle={`최신 5건 · 미확인 ${unreadCount}건`}
      action={
        <div className="flex shrink-0 items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() =>
                markAllRead.mutate(undefined, { onSuccess: refreshDashboard })
              }
              className="text-fg-subtle hover:text-fg text-xs font-medium"
            >
              모두 읽기
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="text-fg-subtle hover:text-fg text-xs font-medium"
          >
            전체 보기 →
          </button>
        </div>
      }
    >
      {visible.length === 0 ? (
        <EmptyState icon={BellOff} title="새 알림이 없어요" />
      ) : (
        <ul className="flex flex-col">
          {visible.map((n) => {
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
                    onClick={() => {
                      // 클릭 = 확인 → 해당 알림만 읽음 처리(멱등) 후 이동.
                      if (n.unread) {
                        markOneRead.mutate(n.id, {
                          onSuccess: refreshDashboard,
                        })
                      }
                      navigate(link)
                    }}
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
