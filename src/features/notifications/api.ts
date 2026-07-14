import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { useAuth } from '@/shared/store'
import type { AppNotification } from '@/shared/types'

export const notificationKeys = {
  all: ['notifications'] as const,
}

// 헤더 알림 벨 데이터 — 역할 무관 서버 알림(GET /notifications).
// 개인 알림 + 내 역할 브로드캐스트(예: 매니저의 QnA 작성 알림)를 합쳐 돌려준다.
// 로그인한 모든 역할에서 조회한다.
export function useRoleNotifications() {
  const { role } = useAuth()
  return useQuery({
    queryKey: [...notificationKeys.all, role],
    enabled: !!role,
    queryFn: () =>
      apiClient.get<AppNotification[]>('/notifications').then((r) => r.data),
  })
}

// 알림 전체 읽음 — PATCH /notifications/read.
// 서버에 읽음을 영속(개인=read_at, 역할 브로드캐스트=notification_reads)하고 벨 목록을 갱신한다.
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient
        .patch<AppNotification[]>('/notifications/read')
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

// 알림 1건 읽음 — PATCH /notifications/{id}/read. 벨에서 알림을 클릭(이동)할 때 호출한다.
// 멱등이라 이미 읽은 알림을 눌러도 안전하다.
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient
        .patch<AppNotification[]>(`/notifications/${id}/read`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
