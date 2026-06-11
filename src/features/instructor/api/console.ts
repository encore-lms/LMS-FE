import { useQuery } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorDashboardData,
  InstructorCohortsData,
  CohortStudentsData,
} from '@/shared/types'

// 강사 콘솔 골격 (대시보드·담당 과정/기수·수강생 목록) 데이터. baseURL이 /api라 경로 앞에 안 붙임.
export function useInstructorDashboard() {
  return useQuery({
    queryKey: instructorKeys.dashboard(),
    queryFn: () =>
      apiClient
        .get<InstructorDashboardData>('/instructor/dashboard')
        .then((r) => r.data),
  })
}

export function useInstructorCohorts() {
  return useQuery({
    queryKey: instructorKeys.cohorts(),
    queryFn: () =>
      apiClient
        .get<InstructorCohortsData>('/instructor/cohorts')
        .then((r) => r.data),
  })
}

export function useCohortStudents(cohortId: string) {
  return useQuery({
    queryKey: instructorKeys.cohortStudents(cohortId),
    queryFn: () =>
      apiClient
        .get<CohortStudentsData>(`/instructor/cohorts/${cohortId}/students`)
        .then((r) => r.data),
  })
}
