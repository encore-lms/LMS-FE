import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorAssignmentListData,
  AssignmentFormDetail,
  AssignmentFileRef,
  AssignmentSubmissionsData,
} from '@/shared/types'

// 강사 과제·실습 Main Flow (/instructor/assignments*) — 실 BE(learning-service). baseURL '/api'.
// cohortId 지정 시 해당 기수로 서버 스코프(과정·기수 허브의 과제 탭 임베드).
export function useInstructorAssignments(cohortId?: string | null) {
  return useQuery({
    queryKey: [...instructorKeys.assignments(), cohortId ?? 'all'],
    queryFn: () =>
      apiClient
        .get<InstructorAssignmentListData>('/instructor/assignments', {
          cohortId: cohortId ?? undefined,
        })
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
  title: string
  dueAt?: string // "yyyy-MM-dd HH:mm"
  description?: string
  urls?: string[] // 첨부 링크(최대 5) — 저장 시 전면 교체
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

// 과제 첨부 파일 업로드(multipart) — 과제 저장(실 id 확보) 후 호출.
export function useUploadAssignmentFile() {
  return useMutation<
    AssignmentFileRef,
    Error,
    { assignmentId: string; file: File }
  >({
    mutationFn: ({ assignmentId, file }) => {
      const form = new FormData()
      form.append('file', file)
      return apiClient
        .postForm<AssignmentFileRef>(
          `/instructor/assignments/${assignmentId}/attachments/file`,
          form,
        )
        .then((r) => r.data)
    },
  })
}

// 과제 첨부 파일 삭제.
export function useDeleteAssignmentFile() {
  return useMutation<void, Error, { assignmentId: string; fileId: string }>({
    mutationFn: ({ assignmentId, fileId }) =>
      apiClient
        .delete<void>(
          `/instructor/assignments/${assignmentId}/attachments/${fileId}`,
        )
        .then(() => undefined),
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
