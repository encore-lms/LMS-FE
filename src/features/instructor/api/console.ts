import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorDashboardData,
  InstructorCohortsData,
  CohortStudentsData,
  StudentDetailData,
} from '@/shared/types'

// 강사 콘솔 골격 (대시보드·담당 과정/기수·수강생 목록) 데이터. baseURL이 /api라 경로 앞에 안 붙임.
// cohortId 지정 시 해당 기수 대시보드(KPI·우선처리·바로가기), 미지정이면 기본(첫 기수).
export function useInstructorDashboard(cohortId?: string | null) {
  return useQuery({
    queryKey: [...instructorKeys.dashboard(), cohortId ?? 'default'],
    // 기수 전환 시 이전 데이터를 유지해 로딩 깜빡임 방지.
    placeholderData: keepPreviousData,
    queryFn: () =>
      apiClient
        .get<InstructorDashboardData>('/instructor/dashboard', {
          cohortId: cohortId ?? undefined,
        })
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

export function useStudentDetail(studentId: string) {
  return useQuery({
    queryKey: instructorKeys.studentDetail(studentId),
    queryFn: () =>
      apiClient
        .get<StudentDetailData>(`/instructor/students/${studentId}`)
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

// 검토 코멘트 저장(학생 비공개) — mock PATCH. 실 BE 계약 확정 시 페어가 교체.
export function useSaveReviewComment(studentId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (reviewComment) =>
      apiClient
        .patch<void>(`/instructor/students/${studentId}`, { reviewComment })
        .then(() => undefined),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: instructorKeys.studentDetail(studentId),
      }),
  })
}
