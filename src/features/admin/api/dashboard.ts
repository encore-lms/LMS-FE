import { useQuery } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type { AdminOperatorDashboard } from '../dashboard/types'
import type { AttendanceAnalytics } from '../dashboard/analyticsTypes'

// 운영 대시보드 훅 — BE GET /admin/dashboard(AdminOperatorDashboard). /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () =>
      apiClient
        .get<AdminOperatorDashboard>('/admin/dashboard')
        .then((r) => r.data),
  })
}

// 출석률 분석 — 모달 열릴 때만(enabled) 조회. 응답에 aggregate + perCohort가 함께 오므로
// 기수 선택은 클라이언트에서 전환하고, includeDropouts만 재조회 트리거.
export function useAttendanceAnalytics(
  enabled: boolean,
  includeDropouts: boolean,
) {
  return useQuery({
    queryKey: [...adminKeys.dashboard(), 'analytics', includeDropouts],
    queryFn: () =>
      apiClient
        .get<AttendanceAnalytics>(
          `/admin/dashboard/attendance-analytics?includeDropouts=${includeDropouts}`,
        )
        .then((r) => r.data),
    enabled,
  })
}
