import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { useAuth } from '@/shared/store'
import type { AppNotification } from '@/shared/types'

export const notificationKeys = {
  all: ['notifications'] as const,
}

// 헤더 알림 벨 데이터 — 역할별 서버 알림.
// 현재 서버(mock) 엔드포인트는 수강생 경량 /student/notifications 뿐이라 그 외 역할은
// 조회를 끄고 로컬 알림·빈 상태만 노출한다. BE 알림 API가 역할별로 확정되면
// 여기서 엔드포인트 분기만 추가하면 된다(벨 UI는 전 역할 공통).
export function useRoleNotifications() {
  const { role } = useAuth()
  return useQuery({
    queryKey: [...notificationKeys.all, role],
    enabled: role === 'STUDENT',
    queryFn: () =>
      apiClient
        .get<AppNotification[]>('/student/notifications')
        .then((r) => r.data),
  })
}

// 수강생 알림 전체 읽음 — PATCH /student/notifications/read.
// 서버에 read_at 을 기록(영속)하고 벨 목록을 무효화해 갱신한다. 수강생 전용 엔드포인트라
// 호출부(NotificationBell)에서 역할을 확인하고 STUDENT 일 때만 호출한다.
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient
        .patch<AppNotification[]>('/student/notifications/read')
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
