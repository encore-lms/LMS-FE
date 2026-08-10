import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { MyWeeklyReport, WeeklyDiagnosisReport } from './types'

// 진단 리포트 쿼리 — baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다.
export const diagnosisKeys = {
  all: ['student-diagnosis'] as const,
  reports: () => [...diagnosisKeys.all, 'reports'] as const,
  myReports: () => [...diagnosisKeys.all, 'my-reports'] as const,
}

/** 그룹 주간 진단 리포트 전체(24주, 매니저용) — 주차 선택은 클라이언트에서 한다 */
export function useDiagnosisReports() {
  return useQuery({
    queryKey: diagnosisKeys.reports(),
    queryFn: () =>
      apiClient
        .get<WeeklyDiagnosisReport[]>('/student/course/diagnosis/reports')
        .then((r) => r.data),
  })
}

/** 내 주간 진단 리포트 전체(24주, 수강생용) */
export function useMyDiagnosisReports() {
  return useQuery({
    queryKey: diagnosisKeys.myReports(),
    queryFn: () =>
      apiClient
        .get<MyWeeklyReport[]>('/student/course/diagnosis/my-reports')
        .then((r) => r.data),
  })
}
