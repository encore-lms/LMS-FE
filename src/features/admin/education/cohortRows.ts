import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminKeys } from '@/shared/api/queryKeys'

/** 담당 과정/기수 목록의 한 줄 — 강사 목록(InstructorCohortRow)과 같은 스키마. */
export interface AdminCohortRow {
  id: string
  courseId: string
  /** '과정명 32기' */
  name: string
  /** '과정명 · 32회차' */
  subtitle: string
  /** '2026.04.28 ~ 2026.10.26' */
  period: string
  dday: string
  /** 그 기수를 맡은 강사 이름. 배정이 없으면 빈 배열. */
  instructors: string[]
  hrdTrprId: string | null
  students: number
  evalSummary: string
  evalPending: string
  reviewSummary: string
  reviewPending: string
  status: 'operating' | 'upcoming' | 'ended'
}

export interface AdminCohortsData {
  total: number
  operating: number
  upcoming: number
  ended: number
  summary: {
    operatingCourses: { value: number; hint: string }
    students: { value: number; hint: string }
    gradingPending: { value: number; hint: string }
    reviewPending: { value: number; hint: string }
  }
  rows: AdminCohortRow[]
}

/**
 * 운영 담당 과정/기수 목록.
 *
 * <p>예전에는 매니저용 기수 API 가 없어 과정 상세를 과정 수만큼 병렬로 불러 합쳤고, 그래서
 * 평가·검토 집계를 채울 수 없었다. BE 의 {@code GET /admin/cohorts} 가 강사 목록과 같은
 * 스키마로 집계까지 내려주므로 그대로 받는다.</p>
 */
export function useAdminCohorts() {
  return useQuery({
    queryKey: adminKeys.cohorts(),
    queryFn: () =>
      apiClient.get<AdminCohortsData>('/admin/cohorts').then((r) => r.data),
  })
}
