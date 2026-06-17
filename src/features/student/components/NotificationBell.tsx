import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useStudentNotifications } from '../api/notifications'

// 헤더 알림 벨 — 대시보드 알림 데이터를 드롭다운으로 노출. 미확인 수 배지 + 모두 읽기(로컬 반영).
// 읽음 처리 mutation은 BE 계약 확정 후 — 현재는 로컬 readIds 로 미확인 점을 끈다.
export function NotificationBell() {
  const { data } = useStudentNotifications()
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  // 서버 unread 와 로컬 읽음 처리를 합성.
  const notifications = useMemo(
    () =>
      (data ?? []).map((n) => ({
        ...n,
        unread: n.unread && !readIds.has(n.id),
      })),
    [data, readIds],
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

  const markAllRead = () => setReadIds(new Set((data ?? []).map((n) => n.id)))

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
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="hover:bg-surface-muted flex items-start justify-between gap-3 rounded-lg px-3 py-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-fg truncate text-[13px]">
                      {n.title}
                    </span>
                    <span className="text-fg-subtle text-[11px]">
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
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
