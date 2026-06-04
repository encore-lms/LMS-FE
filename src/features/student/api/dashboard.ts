import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { dashboardKeys } from '../dashboard/queryKeys'
import type { StudentDashboardSummary } from '../dashboard/types'

// 수강생 대시보드 요약 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useStudentDashboard() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () =>
      apiClient
        .get<StudentDashboardSummary>('/student/dashboard')
        .then((r) => r.data),
  })
}
