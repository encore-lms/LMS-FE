import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminMentoringKeys } from './queryKeys'
import type {
  AdminCohortAssignmentOptions,
  AdminMentoringTeamDetail,
  AdminLogTemplate,
  AdminLogTemplatesData,
  AdminMentoringLogDetail,
  AdminMentoringLogsData,
  AdminMentoringStatisticsData,
  AdminTeamLogField,
  AdminTeamLogFieldsData,
  AdminTemplateField,
  MentorAssignmentCreateRequest,
  MentorAssignmentFromStudentsRequest,
  MentorAssignmentRow,
  MentorAssignmentsData,
  MentoringLogChangeRequestPayload,
  TemplateCreatePayload,
} from './types'

// 운영 멘토링 API 훅 — P0_25_26 명세 경로 그대로(apiClient baseURL /api → 경로 앞 미부착).
// 캐시 키는 기능 로컬 adminMentoringKeys(공유 queryKeys.ts 무수정).

/**
 * GET /admin/mentors/assignments — 배정 보드(미배정 팀 포함).
 * cohortId 를 주면 그 기수(상단 셀렉터) 보드, 없으면 담당/폴백 기수.
 */
export function useMentorAssignments(cohortId?: string | null) {
  const scope = cohortId && cohortId !== 'all' ? cohortId : null
  return useQuery({
    queryKey: [...adminMentoringKeys.assignments(), scope ?? 'default'],
    queryFn: () =>
      apiClient
        .get<MentorAssignmentsData>(
          '/admin/mentors/assignments',
          scope ? { cohort: scope } : undefined,
        )
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

/** GET /admin/mentors/assignments/teams/{teamId} — 팀 상세(개요·멘티 명단·일지). */
export function useMentoringTeamDetail(teamId: string | null) {
  return useQuery({
    queryKey: [...adminMentoringKeys.assignments(), 'team', teamId ?? ''],
    enabled: !!teamId,
    queryFn: () =>
      apiClient
        .get<AdminMentoringTeamDetail>(
          `/admin/mentors/assignments/teams/${teamId}`,
        )
        .then((r) => r.data),
  })
}

/**
 * GET /admin/mentors/assignments/cohorts/{cohortId}/students
 * — 기수 수강생 + 활성 템플릿 + 멘토(부하 포함). 수강생 기반 배정 폼 선택지.
 */
export function useCohortStudents(cohortId: string | null) {
  return useQuery({
    queryKey: [...adminMentoringKeys.assignments(), 'students', cohortId ?? ''],
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        .get<AdminCohortAssignmentOptions>(
          `/admin/mentors/assignments/cohorts/${cohortId}/students`,
        )
        .then((r) => r.data),
  })
}

/**
 * POST /admin/mentors/assignments/from-students — 수강생 선택으로 새 팀 생성 + 멘토 배정.
 * 반/기수는 상단 셀렉터로 고정. 성공 시 배정 보드 무효화.
 */
export function useCreateMentorAssignmentFromStudents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MentorAssignmentFromStudentsRequest) =>
      apiClient
        .post<MentorAssignmentRow>(
          '/admin/mentors/assignments/from-students',
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.assignments(),
      })
    },
  })
}

/** POST /admin/mentors/assignments/teams/{teamId}/members — 멘티(팀원) 추가. */
export function useAddTeamMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamId,
      studentUserIds,
    }: {
      teamId: string
      studentUserIds: string[]
    }) =>
      apiClient
        .post<AdminMentoringTeamDetail>(
          `/admin/mentors/assignments/teams/${teamId}/members`,
          { studentUserIds },
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.assignments(),
      })
    },
  })
}

/** PATCH /admin/mentors/assignments/teams/{teamId}/name — 팀명 수정. */
export function useRenameTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, name }: { teamId: string; name: string }) =>
      apiClient
        .patch<MentorAssignmentRow>(
          `/admin/mentors/assignments/teams/${teamId}/name`,
          { name },
        )
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

/** PATCH /admin/mentors/assignments/{id}/template — 일지 템플릿 교체(이후 일지에 새 템플릿 적용·기존 일지 보존). */
export function useChangeAssignmentTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      logTemplateId,
    }: {
      assignmentId: string
      logTemplateId: string
    }) =>
      apiClient
        .patch<MentorAssignmentRow>(
          `/admin/mentors/assignments/${assignmentId}/template`,
          { logTemplateId },
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

/**
 * DELETE /admin/mentors/assignments/teams/{teamId} — 배정(팀) 삭제.
 * 잘못 만든 배정 취소용. 활동 이력(일지·평가·추천서·예약)이 있으면 BE가 409로 거부한다.
 */
export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teamId: string) =>
      apiClient
        .delete<void>(`/admin/mentors/assignments/teams/${teamId}`)
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
      // 팀 상세 일지 타임라인(assignments 접두사 키)도 갱신.
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.assignments(),
      })
    },
  })
}

/**
 * POST /admin/mentoring/logs/{logId}/approve — 매니저 승인.
 * 제출됨(승인 대기) → 유효 + 인정 시간 산입. 성공 시 목록 + 상세 + 팀 상세 무효화.
 */
export function useApproveLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (logId: string) =>
      apiClient
        .post<AdminMentoringLogDetail>(
          `/admin/mentoring/logs/${logId}/approve`,
          {},
        )
        .then((r) => r.data),
    onSuccess: (_data, logId) => {
      queryClient.invalidateQueries({ queryKey: adminMentoringKeys.logs() })
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.logDetail(logId),
      })
      // 팀 상세 일지 타임라인(assignments 접두사 키)도 갱신 — 승인 즉시 반영.
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.assignments(),
      })
    },
  })
}

/** DELETE /admin/mentoring/logs/{logId} — 매니저 일지 삭제(정정·정리). 삭제 후 목록·팀 타임라인 갱신. */
export function useDeleteMentoringLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (logId: string) =>
      apiClient
        .delete<void>(`/admin/mentoring/logs/${logId}`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminMentoringKeys.logs() })
      // 팀 상세 일지 타임라인·보드 일지 수(assignments 접두사 키) 갱신.
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.assignments(),
      })
    },
  })
}

// ───────────────────────── 일지 템플릿 (§31) ─────────────────────────

/** GET /admin/mentoring/log-templates — 템플릿 목록(항목 포함, 비활성 포함). */
export function useLogTemplates() {
  return useQuery({
    queryKey: adminMentoringKeys.logTemplates(),
    queryFn: () =>
      apiClient
        .get<AdminLogTemplatesData>('/admin/mentoring/log-templates')
        .then((r) => r.data),
  })
}

/** 템플릿 mutation 공통 onSuccess — 목록 + 배정 폼 선택지(배정 보드) 무효화. */
function useInvalidateTemplates() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({
      queryKey: adminMentoringKeys.logTemplates(),
    })
    // 배정 폼 템플릿 선택지가 같은 상태에서 파생 — 비활성화·생성 즉시 반영.
    queryClient.invalidateQueries({
      queryKey: adminMentoringKeys.assignments(),
    })
  }
}

/** POST /admin/mentoring/log-templates — 새 템플릿(이름 필수 422). */
export function useCreateLogTemplate() {
  const invalidate = useInvalidateTemplates()
  return useMutation({
    mutationFn: (payload: TemplateCreatePayload) =>
      apiClient
        .post<AdminLogTemplate>('/admin/mentoring/log-templates', payload)
        .then((r) => r.data),
    onSuccess: invalidate,
  })
}

/** POST /admin/mentoring/log-templates/{id}/duplicate — 복제(항목 포함). */
export function useDuplicateLogTemplate() {
  const invalidate = useInvalidateTemplates()
  return useMutation({
    mutationFn: (templateId: string) =>
      apiClient
        .post<AdminLogTemplate>(
          `/admin/mentoring/log-templates/${templateId}/duplicate`,
        )
        .then((r) => r.data),
    onSuccess: invalidate,
  })
}

/** PATCH /admin/mentoring/log-templates/{id} — 항목 편집(기존 일지 스냅샷 보존·새 일지부터 적용). */
export function useUpdateTemplateFields() {
  const invalidate = useInvalidateTemplates()
  return useMutation({
    mutationFn: ({
      templateId,
      fields,
    }: {
      templateId: string
      fields: AdminTemplateField[]
    }) =>
      apiClient
        .patch<AdminLogTemplate>(
          `/admin/mentoring/log-templates/${templateId}`,
          { fields },
        )
        .then((r) => r.data),
    onSuccess: invalidate,
  })
}

/** PATCH /admin/mentoring/log-templates/{id}/meta — 템플릿 이름·설명 수정. */
export function useUpdateTemplateMeta() {
  const invalidate = useInvalidateTemplates()
  return useMutation({
    mutationFn: ({
      templateId,
      name,
      description,
    }: {
      templateId: string
      name: string
      description?: string
    }) =>
      apiClient
        .patch<AdminLogTemplate>(
          `/admin/mentoring/log-templates/${templateId}/meta`,
          { name, description: description ?? '' },
        )
        .then((r) => r.data),
    onSuccess: invalidate,
  })
}

/** PATCH /admin/mentoring/log-templates/{id}/status — 비활성화/복원(기본 템플릿 비활성화 422). */
export function useSetTemplateStatus() {
  const invalidate = useInvalidateTemplates()
  return useMutation({
    mutationFn: ({
      templateId,
      isActive,
    }: {
      templateId: string
      isActive: boolean
    }) =>
      apiClient
        .patch<AdminLogTemplate>(
          `/admin/mentoring/log-templates/${templateId}/status`,
          { isActive },
        )
        .then((r) => r.data),
    onSuccess: invalidate,
  })
}

// ───────────────────────── 팀별 일지 항목 (§32) ─────────────────────────

/**
 * GET /admin/mentoring/assignments/{assignmentId}/log-fields — 팀 항목 + 템플릿 기준.
 * 화면 라우트는 teamId — assignmentId 매핑은 배정 보드(useMentorAssignments)에서 해소.
 */
export function useTeamLogFields(assignmentId: string | null) {
  return useQuery({
    queryKey: adminMentoringKeys.teamLogFields(assignmentId ?? ''),
    enabled: !!assignmentId,
    queryFn: () =>
      apiClient
        .get<AdminTeamLogFieldsData>(
          `/admin/mentoring/assignments/${assignmentId}/log-fields`,
        )
        .then((r) => r.data),
  })
}

/** PUT .../log-fields — 변경 일괄 저장(다음 일지부터 적용 · 작성된 일지 보존). */
export function useSaveTeamLogFields() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      fields,
    }: {
      assignmentId: string
      fields: AdminTeamLogField[]
    }) =>
      apiClient
        .put<AdminTeamLogFieldsData>(
          `/admin/mentoring/assignments/${assignmentId}/log-fields`,
          { fields },
        )
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.teamLogFields(vars.assignmentId),
      })
    },
  })
}

/** POST .../log-fields/reset — 템플릿으로 되돌리기(이 팀 수정 사항 일괄 복원). */
export function useResetTeamLogFields() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) =>
      apiClient
        .post<AdminTeamLogFieldsData>(
          `/admin/mentoring/assignments/${assignmentId}/log-fields/reset`,
        )
        .then((r) => r.data),
    onSuccess: (_data, assignmentId) => {
      queryClient.invalidateQueries({
        queryKey: adminMentoringKeys.teamLogFields(assignmentId),
      })
    },
  })
}

// ───────────────────────── 멘토 통계 (§33) — 조회 전용 ─────────────────────────

/** GET /admin/mentoring/statistics — 조회 전용(mutation 훅 없음, 403 READ_ONLY 정책). */
export function useMentoringStatistics() {
  return useQuery({
    queryKey: adminMentoringKeys.statistics(),
    queryFn: () =>
      apiClient
        .get<AdminMentoringStatisticsData>('/admin/mentoring/statistics')
        .then((r) => r.data),
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
