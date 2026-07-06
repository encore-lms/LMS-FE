import { useQuery } from '@tanstack/react-query'
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
