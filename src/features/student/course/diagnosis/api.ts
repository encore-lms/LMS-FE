import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { WeeklyDiagnosisReport } from './types'

// 진단 리포트 쿼리 — baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다.
export const diagnosisKeys = {
  all: ['student-diagnosis'] as const,
  reports: () => [...diagnosisKeys.all, 'reports'] as const,
}

/** 주간 진단 리포트 전체(24주) — 주차 선택은 클라이언트에서 한다 */
export function useDiagnosisReports() {
  return useQuery({
    queryKey: diagnosisKeys.reports(),
    queryFn: () =>
      apiClient
        .get<WeeklyDiagnosisReport[]>('/student/course/diagnosis/reports')
        .then((r) => r.data),
  })
}
