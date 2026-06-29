import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorAssignmentListData,
  AssignmentFormDetail,
  AssignmentSubmissionsData,
} from '@/shared/types'

// 강사 과제·실습 Main Flow (/instructor/assignments*) — 실 BE(learning-service). baseURL '/api'.
export function useInstructorAssignments() {
  return useQuery({
    queryKey: instructorKeys.assignments(),
    queryFn: () =>
      apiClient
        .get<InstructorAssignmentListData>('/instructor/assignments')
        .then((r) => r.data),
  })
}

// 생성 폼 기수 옵션(실 기수 cohortId + 라벨)
export interface AssignmentCohortOption {
  cohortId: string
  label: string
}
export function useAssignmentCohortOptions() {
  return useQuery({
    queryKey: instructorKeys.assignmentCohortOptions(),
    queryFn: () =>
      apiClient
        .get<AssignmentCohortOption[]>('/instructor/assignments/cohort-options')
        .then((r) => r.data),
  })
}

export function useAssignmentDetail(assignmentId: string | null) {
  return useQuery({
    queryKey: instructorKeys.assignmentDetail(assignmentId ?? ''),
    enabled: !!assignmentId,
    queryFn: () =>
      apiClient
        .get<AssignmentFormDetail>(`/instructor/assignments/${assignmentId}`)
        .then((r) => r.data),
  })
}

export interface SaveAssignmentInput {
  cohortId: string
  subject?: string
  title: string
  dueAt?: string // "yyyy-MM-dd HH:mm"
  description?: string
}
// 생성(POST) 또는 수정(PUT, assignmentId 지정)
export function useSaveAssignment(assignmentId?: string) {
  const queryClient = useQueryClient()
  return useMutation<AssignmentFormDetail, Error, SaveAssignmentInput>({
    mutationFn: (input) =>
      (assignmentId
        ? apiClient.put<AssignmentFormDetail>(
            `/instructor/assignments/${assignmentId}`,
            input,
          )
        : apiClient.post<AssignmentFormDetail>('/instructor/assignments', input)
      ).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.assignments() })
      if (assignmentId)
        queryClient.invalidateQueries({
          queryKey: instructorKeys.assignmentDetail(assignmentId),
        })
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (assignmentId) =>
      apiClient
        .delete<void>(`/instructor/assignments/${assignmentId}`)
        .then(() => undefined),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: instructorKeys.assignments() }),
  })
}

export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: instructorKeys.assignmentSubmissions(assignmentId),
    queryFn: () =>
      apiClient
        .get<AssignmentSubmissionsData>(
          `/instructor/assignments/${assignmentId}/submissions`,
        )
        .then((r) => r.data),
  })
}

export function useChangeSubmissionStatus(assignmentId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { submissionId: string; status: string; feedback?: string }
  >({
    mutationFn: ({ submissionId, status, feedback }) =>
      apiClient
        .patch<void>(
          `/instructor/assignments/${assignmentId}/submissions/${submissionId}`,
          { status, feedback },
        )
        .then(() => undefined),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: instructorKeys.assignmentSubmissions(assignmentId),
      }),
  })
}
