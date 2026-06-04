import { useQuery } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type { AdminDashboardSummary } from '@/shared/types'

// 운영 대시보드 요약 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () =>
      apiClient
        .get<AdminDashboardSummary>('/admin/dashboard')
        .then((r) => r.data),
  })
}
