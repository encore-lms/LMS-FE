import { useQuery } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorAssignmentListData,
  AssignmentFormDetail,
  AssignmentSubmissionsData,
} from '@/shared/types'

// 강사 과제·실습 Main Flow (/instructor/assignments*) 데이터. baseURL이 /api라 경로 앞에 안 붙임.
export function useInstructorAssignments() {
  return useQuery({
    queryKey: instructorKeys.assignments(),
    queryFn: () =>
      apiClient
        .get<InstructorAssignmentListData>('/instructor/assignments')
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
