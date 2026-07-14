import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuth } from '@/shared/store'
import type { AppNotification } from '@/shared/types'

// 알림 훅 — 헤더 알림 벨(features/notifications)과 수강생 대시보드 알림 목록이 함께 쓰므로
// feature api 레이어가 아닌 shared로 승격했다(교차 사용 규칙, shared/api/students.ts와 동일 취지).
export const notificationKeys = {
  all: ['notifications'] as const,
}

// 헤더 알림 벨 데이터 — 역할 무관 서버 알림(GET /notifications).
// 개인 알림 + 내 역할 브로드캐스트(예: 매니저의 QnA 질문 알림)를 합쳐 돌려준다.
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

// 알림 1건 읽음 — PATCH /notifications/{id}/read. 알림을 클릭(이동)할 때 호출한다.
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

// 알림 1건 삭제 — DELETE /notifications/{id}.
// 개인 알림은 본인만, 역할 공유 알림은 관리자만(지우면 전원에게서 사라짐) — BE가 강제한다.
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient
        .delete<AppNotification[]>(`/notifications/${id}`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
