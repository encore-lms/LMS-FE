import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, X } from 'lucide-react'
import {
  useDeleteNotification,
  useMarkNotificationRead,
  useMarkNotificationsRead,
  useNotificationInbox,
} from '@/shared/api/notifications'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import type { AppNotification } from '@/shared/types'

// 알림 전체 화면 — 전 역할 공용(/notifications). 헤더 벨은 최신 10건만 보여주고
// 나머지는 여기서 본다. 분류 칩으로 활동별로 좁히고, 스크롤로 계속 이어 받는다(커서 페이지네이션).
export function NotificationsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [category, setCategory] = useState<string | null>(null)
  const query = useNotificationInbox(category)
  const markAllRead = useMarkNotificationsRead()
  const markOneRead = useMarkNotificationRead()
  const deleteOne = useDeleteNotification()

  const pages = query.data?.pages ?? []
  const items = useMemo(() => pages.flatMap((p) => p.items), [pages])
  // 칩·미확인 수는 필터와 무관한 전체 기준이라 항상 첫 페이지 값을 쓴다.
  const chips = pages[0]?.categories ?? []
  const unreadTotal = pages[0]?.unreadTotal ?? 0

  // 목록 끝 감시자 — 바닥에 닿으면 다음 페이지를 당겨온다(버튼 없이 이어지는 스크롤).
  const sentinel = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    const node = sentinel.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const openNotification = (n: AppNotification) => {
    if (n.unread) markOneRead.mutate(n.id)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="mx-auto w-full max-w-[880px] px-8 py-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-fg text-2xl font-bold">알림</h1>
          <p className="text-fg-subtle mt-1 text-sm">
            미확인 {unreadTotal}건 · 활동별로 나눠 볼 수 있어요
          </p>
        </div>
        {unreadTotal > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-fg-subtle hover:text-fg shrink-0 text-sm font-medium disabled:opacity-50"
          >
            모두 읽기
          </button>
        )}
      </header>

      {/* 필터 칩 — 건수 0인 분류는 BE가 빼고 내려준다(고를 수 없는 칩을 늘리지 않는다). */}
      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = category === chip.key
          return (
            <button
              key={chip.key ?? 'ALL'}
              type="button"
              onClick={() => setCategory(chip.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-brand-deep text-white'
                  : 'bg-surface-muted text-fg-muted hover:text-fg',
              )}
            >
              {chip.label}
              <span className={cn('ml-1.5', active ? 'opacity-80' : 'opacity-60')}>
                {chip.count}
              </span>
            </button>
          )
        })}
      </div>

      <DataBoundary
        isPending={query.isPending}
        isError={query.isError}
        onRetry={query.refetch}
        className="mt-6"
        skeleton={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
            ))}
          </div>
        }
      >
        {items.length === 0 ? (
          <Empty
            icon={<BellOff />}
            title="알림이 없어요"
            description="새 소식이 오면 여기에 쌓여요."
            className="mt-6"
          />
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {items.map((n) => (
              <li key={n.id} className="group relative">
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl px-4 py-3.5 pr-11 text-left transition-colors',
                    n.unread ? 'bg-surface-muted' : 'hover:bg-surface-muted',
                  )}
                >
                  <Bell
                    className={cn(
                      'mt-0.5 size-4 shrink-0',
                      n.unread ? 'text-brand' : 'text-fg-subtle',
                    )}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-fg text-sm font-medium">
                      {n.title}
                    </span>
                    <span className="text-fg-subtle flex items-center gap-2 text-xs">
                      {n.categoryLabel && (
                        <span className="bg-white px-1.5 py-0.5 text-[11px] font-medium">
                          {n.categoryLabel}
                        </span>
                      )}
                      <span className="truncate">{n.source}</span>
                    </span>
                  </span>
                  <span className="text-fg-subtle shrink-0 text-xs">
                    {n.relativeTime}
                  </span>
                </button>
                {/* 삭제(✕)는 행 버튼 중첩을 피해 형제로 두고 hover 시 노출한다. */}
                <button
                  type="button"
                  aria-label="알림 삭제"
                  title="알림 삭제"
                  onClick={() =>
                    deleteOne.mutate(n.id, {
                      onError: () =>
                        toast.danger(
                          '알림을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.',
                        ),
                    })
                  }
                  disabled={deleteOne.isPending}
                  className="text-fg-subtle hover:bg-white hover:text-danger absolute top-3 right-3 hidden size-6 items-center justify-center rounded group-hover:flex disabled:opacity-50"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 바닥 감시자 — 여기가 보이면 다음 페이지를 당긴다. */}
        <div ref={sentinel} className="h-px" />
        {isFetchingNextPage && (
          <div className="flex flex-col gap-2 pt-2">
            <Skeleton className="h-[68px] w-full rounded-xl" />
          </div>
        )}
      </DataBoundary>
    </div>
  )
}
