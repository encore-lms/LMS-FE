import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorDashboardData,
  InstructorCohortsData,
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

/** 담당 기수 수강생 1명 — 이름 join·작성 대기 계산용. */
export interface CohortStudent {
  userId: string
  name: string
}

/**
 * 담당 기수 수강생 로스터 — auth-user-service의 기수 스코프 명단(강사 허용).
 * learning 응답(이력서·추천서)은 studentUserId만 주므로 화면이 여기서 이름을 join 한다.
 * (구 /instructor/cohorts/{id}/students는 BE 미구현 404라 폐기 — 로스터 정본은 auth.)
 */
export function useCohortRoster(cohortId?: string | null) {
  return useQuery({
    queryKey: [...instructorKeys.all, 'cohort-roster', cohortId ?? ''],
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        .get<{ items: CohortStudent[] }>('/users/cohort-students', { cohortId })
        .then((r) => r.data.items),
  })
}
