import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminMentoringKeys } from './queryKeys'
import type {
  AdminMentoringLogDetail,
  AdminMentoringLogsData,
  MentorAssignmentCreateRequest,
  MentorAssignmentRow,
  MentorAssignmentsData,
  MentoringLogChangeRequestPayload,
} from './types'

// 운영 멘토링 API 훅 — P0_25_26 명세 경로 그대로(apiClient baseURL /api → 경로 앞 미부착).
// 캐시 키는 기능 로컬 adminMentoringKeys(공유 queryKeys.ts 무수정).

/** GET /admin/mentors/assignments — 배정 보드(미배정 팀 포함). */
export function useMentorAssignments() {
  return useQuery({
    queryKey: adminMentoringKeys.assignments(),
    queryFn: () =>
      apiClient
        .get<MentorAssignmentsData>('/admin/mentors/assignments')
        .then((r) => r.data),
  })
}

/**
 * POST /admin/mentors/assignments — 배정 생성(교체 포함).
 * §29 게이트: 409 MENTOR_ASSIGNMENT_DUPLICATED_COHORT · 422 MENTOR_ASSIGNMENT_HOURS_INVALID ·
 * 템플릿 필수. 같은 팀 재배정은 기존 배정 보존(일지 존재 시 replaced) + 새 배정 생성.
 */
export function useCreateMentorAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MentorAssignmentCreateRequest) =>
      apiClient
        .post<MentorAssignmentRow>('/admin/mentors/assignments', payload)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.assignments(),
      })
    },
  })
}

/** PATCH /admin/mentors/assignments/{id} — 멘토 교체(일지 존재 시 409 MENTOR_ASSIGNMENT_HAS_LOGS). */
export function useChangeAssignmentMentor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      mentorId,
    }: {
      assignmentId: string
      mentorId: string
    }) =>
      apiClient
        .patch<MentorAssignmentRow>(
          `/admin/mentors/assignments/${assignmentId}`,
          {
            mentorId,
          },
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.assignments(),
      })
    },
  })
}

/** PATCH /admin/mentors/assignments/{id}/allocated-hours — N시간 수정(감소=인정 유지·증가=재계산). */
export function useUpdateAllocatedHours() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      allocatedHours,
    }: {
      assignmentId: string
      allocatedHours: number
    }) =>
      apiClient
        .patch<MentorAssignmentRow>(
          `/admin/mentors/assignments/${assignmentId}/allocated-hours`,
          { allocatedHours },
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.assignments(),
      })
    },
  })
}

/** POST /admin/mentors/assignments/{id}/early-end — 조기 종료(사유 필수 422). */
export function useEarlyEndAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      reason,
    }: {
      assignmentId: string
      reason: string
    }) =>
      apiClient
        .post<MentorAssignmentRow>(
          `/admin/mentors/assignments/${assignmentId}/early-end`,
          { reason },
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.assignments(),
      })
    },
  })
}

/** GET /admin/mentoring/logs — 일지 목록(KPI·요약 포함). */
export function useAdminMentoringLogs() {
  return useQuery({
    queryKey: adminMentoringKeys.logs(),
    queryFn: () =>
      apiClient
        .get<AdminMentoringLogsData>('/admin/mentoring/logs')
        .then((r) => r.data),
  })
}

/** GET /admin/mentoring/logs/{logId} — 선택 일지 상세(스냅샷·이력). */
export function useAdminMentoringLogDetail(logId: string | null) {
  return useQuery({
    queryKey: adminMentoringKeys.logDetail(logId ?? ''),
    enabled: !!logId,
    queryFn: () =>
      apiClient
        .get<AdminMentoringLogDetail>(`/admin/mentoring/logs/${logId}`)
        .then((r) => r.data),
  })
}

/**
 * POST /admin/mentoring/logs/{logId}/change-requests — 수정 요청.
 * 사유 코드 6종 + 상세 메모 필수(422) · 미해결 1건(409) — FE 는 폼에서 선차단.
 * 성공 시 목록 + 해당 상세 캐시 무효화.
 */
export function useCreateLogChangeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      logId,
      payload,
    }: {
      logId: string
      payload: MentoringLogChangeRequestPayload
    }) =>
      apiClient
        .post<AdminMentoringLogDetail>(
          `/admin/mentoring/logs/${logId}/change-requests`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: adminMentoringKeys.logs() })
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.logDetail(vars.logId),
      })
    },
  })
}

/** axios 에러 응답 {code, message} 추출 — 게이트 코드별 토스트 분기용. */
export function apiErrorOf(error: unknown): {
  code?: string
  message?: string
} {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const data = (
      error as { response?: { data?: { code?: string; message?: string } } }
    ).response?.data
    return { code: data?.code, message: data?.message }
  }
  return {}
}
