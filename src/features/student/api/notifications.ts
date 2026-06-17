import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { DashboardNotification } from '../dashboard/types'

// 헤더 알림 벨 데이터 — 수강생 대시보드 알림과 동일 내용(경량 /student/notifications).
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export const studentNotificationKeys = {
  all: ['student-notifications'] as const,
}

export function useStudentNotifications() {
  return useQuery({
    queryKey: studentNotificationKeys.all,
    queryFn: () =>
      apiClient
        .get<DashboardNotification[]>('/student/notifications')
        .then((r) => r.data),
  })
}
