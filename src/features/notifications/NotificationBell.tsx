import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { useAuth } from '@/shared/store'
import {
  useDeleteNotification,
  useMarkNotificationRead,
  useMarkNotificationsRead,
  useRoleNotifications,
} from '@/shared/api/notifications'
import { useToast } from '@/components/ui/use-toast'
import { useLocalNotificationStore } from './localNotifications'

// 헤더 알림 벨 — 전 역할 공통. 알림 데이터를 드롭다운으로 노출. 미확인 수 배지 + 모두 읽기.
// 서버 알림은 PATCH /notifications/read(전체)·/notifications/{id}/read(클릭 1건)로 영속 읽음 처리,
// 멘션 등 FE 발생 알림(localNotifications)은 로컬 스토어에서 읽음 처리한다.
export function NotificationBell() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { data } = useRoleNotifications()
  const localItems = useLocalNotificationStore((s) => s.items)
  const markLocalRead = useLocalNotificationStore((s) => s.markAllRead)
  const markServerRead = useMarkNotificationsRead()
  const markOneRead = useMarkNotificationRead()
  const deleteOne = useDeleteNotification()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 서버 알림 id 집합 — 클릭 읽음(서버 영속)은 서버 알림에만 적용한다(로컬 알림은 서버 id가 없다).
  const serverIds = useMemo(
    () => new Set((data ?? []).map((n) => n.id)),
    [data],
  )

  // 로컬 알림(최신) + 서버 알림을 합친다. 읽음 여부는 각 소스의 unread 를 그대로 쓴다.
  const notifications = useMemo(
    () => [...localItems, ...(data ?? [])],
    [data, localItems],
  )
  const unreadCount = notifications.filter((n) => n.unread).length

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // 서버 알림은 영속 읽음(전 역할 /notifications/read), 로컬 알림은 스토어에서 읽음 처리.
  const markAllRead = () => {
    if (role) markServerRead.mutate()
    markLocalRead()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}건 미확인` : '알림'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-fg-muted hover:text-fg relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="bg-danger absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="border-border absolute right-0 z-40 mt-2 w-80 rounded-xl border bg-white p-1.5 shadow-[0px_12px_32px_0px_rgba(18,23,38,0.16)]">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-fg text-[13px] font-bold">
              알림{' '}
              <span className="text-fg-subtle font-medium">
                · 미확인 {unreadCount}건
              </span>
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-fg-subtle hover:text-fg text-xs font-medium"
              >
                모두 읽기
              </button>
            )}
          </div>
          <div className="bg-divider mx-1 h-px" />

          {notifications.length === 0 ? (
            <p className="text-fg-subtle px-3 py-6 text-center text-sm">
              알림이 없어요
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {notifications.map((n) => {
                const link = n.link
                // 우측 pr-8 은 삭제(✕) 자리 예약 — 없으면 시간 텍스트와 겹친다.
                const rowClass =
                  'flex w-full items-start justify-between gap-3 rounded-lg py-2 pr-8 pl-3 text-left'
                const content = (
                  <>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-fg truncate text-[13px]">
                        {n.title}
                      </span>
                      <span className="text-fg-subtle truncate text-[11px]">
                        {n.source}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {n.unread && (
                        <span className="bg-brand size-1.5 rounded-full" />
                      )}
                      <span className="text-fg-subtle text-[11px]">
                        {n.relativeTime}
                      </span>
                    </span>
                  </>
                )
                return (
                  // 삭제(✕)는 행 버튼 안에 넣으면 버튼 중첩이 되므로 형제로 두고 hover 시 노출한다.
                  <li key={n.id} className="group relative">
                    {link ? (
                      <button
                        type="button"
                        onClick={() => {
                          // 클릭 = 확인 → 해당 알림만 읽음 처리(서버 영속·멱등) 후 이동.
                          if (n.unread && serverIds.has(n.id)) {
                            markOneRead.mutate(n.id)
                          }
                          setOpen(false)
                          navigate(link)
                        }}
                        className={`hover:bg-surface-muted cursor-pointer ${rowClass}`}
                      >
                        {content}
                      </button>
                    ) : (
                      <div className={rowClass}>{content}</div>
                    )}
                    {serverIds.has(n.id) && (
                      <button
                        type="button"
                        aria-label="알림 삭제"
                        title="알림 삭제"
                        onClick={() =>
                          deleteOne.mutate(n.id, {
                            // BE가 삭제/숨김을 항상 허용하므로 실패는 예외 상황 — 조용히 무시하지 않는다.
                            onError: () =>
                              toast.danger(
                                '알림을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.',
                              ),
                          })
                        }
                        disabled={deleteOne.isPending}
                        className="text-fg-subtle hover:bg-surface-muted hover:text-danger absolute top-1.5 right-1 hidden size-5 items-center justify-center rounded group-hover:flex disabled:opacity-50"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
