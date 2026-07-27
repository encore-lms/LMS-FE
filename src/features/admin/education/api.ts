import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminEducationKeys } from './queryKeys'
import type {
  AssignmentFormDetail,
  AssignmentItem,
  AssignmentSubmissionsData,
  CourseDetail,
  InstructorAssignmentList,
  ResumeDetail,
  ResumeRow,
  CohortProject,
} from './types'

// 설명 탭 — HRD-Net 과정 상세(learning-service). 과정/기수 둘 다 있어야 조회.
// 엔드포인트가 /admin/* 라 admin feature 소유. baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다.
export function useCourseDetail(
  courseId?: string | null,
  cohortId?: string | null,
) {
  return useQuery({
    queryKey: adminEducationKeys.courseDetail(courseId ?? '', cohortId ?? ''),
    enabled: !!courseId && !!cohortId,
    queryFn: () =>
      apiClient
        .get<CourseDetail>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/detail`,
        )
        .then((r) => r.data),
  })
}

// ── 과제(Assignment, learning-service) — 조회·상세·추가·삭제 ──
export function useAssignments(
  courseId?: string | null,
  cohortId?: string | null,
) {
  return useQuery({
    queryKey: adminEducationKeys.assignments(courseId ?? '', cohortId ?? ''),
    enabled: !!courseId && !!cohortId,
    queryFn: () =>
      apiClient
        .get<
          AssignmentItem[]
        >(`/admin/courses/${courseId}/cohorts/${cohortId}/assignments`)
        .then((r) => r.data),
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { courseId: string; cohortId: string; assignmentId: string }
  >({
    mutationFn: ({ courseId, cohortId, assignmentId }) =>
      apiClient
        .delete<void>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/assignments/${assignmentId}`,
        )
        .then(() => undefined),
    onSuccess: (_d, { courseId, cohortId }) =>
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.assignments(courseId, cohortId),
      }),
  })
}

// ── 강사/운영 공용 과제(/instructor/assignments) — 과제 탭(선택 기수 스코프) ──
export function useCohortAssignments(cohortId?: string | null) {
  return useQuery({
    queryKey: adminEducationKeys.cohortAssignments(cohortId ?? ''),
    enabled: !!cohortId,
    // 공용 폼(강사 endpoint, 별도 키)에서 생성·수정 후 복귀 시 항상 최신화 —
    // 이 목록 키를 무효화하지 않으므로 재마운트마다 refetch.
    refetchOnMount: 'always',
    queryFn: () =>
      apiClient
        .get<InstructorAssignmentList>('/admin/assignments', {
          cohortId: cohortId ?? undefined,
        })
        .then((r) => r.data),
  })
}

export interface SaveInstructorAssignmentInput {
  cohortId: string
  title: string
  dueAt?: string // "yyyy-MM-dd HH:mm"
  description?: string
}
export function useCreateInstructorAssignment() {
  const queryClient = useQueryClient()
  return useMutation<
    AssignmentFormDetail,
    Error,
    SaveInstructorAssignmentInput
  >({
    mutationFn: (input) =>
      apiClient
        .post<AssignmentFormDetail>('/admin/assignments', input)
        .then((r) => r.data),
    onSuccess: (_d, { cohortId }) =>
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.cohortAssignments(cohortId),
      }),
  })
}

export function useDeleteInstructorAssignment(cohortId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (assignmentId) =>
      apiClient
        .delete<void>(`/admin/assignments/${assignmentId}`)
        .then(() => undefined),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.cohortAssignments(cohortId),
      }),
  })
}

export function useAssignmentSubmissions(assignmentId: string | null) {
  return useQuery({
    queryKey: adminEducationKeys.assignmentSubmissions(assignmentId ?? ''),
    enabled: !!assignmentId,
    queryFn: () =>
      apiClient
        .get<AssignmentSubmissionsData>(
          `/admin/assignments/${assignmentId}/submissions`,
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
          `/admin/assignments/${assignmentId}/submissions/${submissionId}`,
          { status, feedback },
        )
        .then(() => undefined),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.assignmentSubmissions(assignmentId),
      }),
  })
}

// ── 이력서(Resume, learning-service) — 현황·상세·피드백 ──
export function useResumes(courseId?: string | null, cohortId?: string | null) {
  return useQuery({
    queryKey: adminEducationKeys.resumes(courseId ?? '', cohortId ?? ''),
    enabled: !!courseId && !!cohortId,
    queryFn: () =>
      apiClient
        .get<
          ResumeRow[]
        >(`/admin/courses/${courseId}/cohorts/${cohortId}/resumes`)
        .then((r) => r.data),
  })
}

export function useResume(
  courseId: string,
  cohortId: string,
  resumeId: string | null,
) {
  return useQuery({
    queryKey: adminEducationKeys.resumeDetail(
      courseId,
      cohortId,
      resumeId ?? '',
    ),
    enabled: !!resumeId,
    queryFn: () =>
      apiClient
        .get<ResumeDetail>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/resumes/${resumeId}`,
        )
        .then((r) => r.data),
  })
}

export function useAddResumeFeedback() {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { courseId: string; cohortId: string; resumeId: string; body: string }
  >({
    mutationFn: ({ courseId, cohortId, resumeId, body }) =>
      apiClient
        .post<void>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/resumes/${resumeId}/feedback`,
          { body },
        )
        .then(() => undefined),
    onSuccess: (_d, { courseId, cohortId, resumeId }) => {
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.resumeDetail(courseId, cohortId, resumeId),
      })
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.resumes(courseId, cohortId),
      })
    },
  })
}

// 이력서 피드백 삭제 — BE는 작성자 본인·운영자만 허용.
export function useDeleteResumeFeedback() {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { courseId: string; cohortId: string; resumeId: string; feedbackId: string }
  >({
    mutationFn: ({ courseId, cohortId, resumeId, feedbackId }) =>
      apiClient
        .delete<void>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/resumes/${resumeId}/feedback/${feedbackId}`,
        )
        .then(() => undefined),
    onSuccess: (_d, { courseId, cohortId, resumeId }) => {
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.resumeDetail(courseId, cohortId, resumeId),
      })
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.resumes(courseId, cohortId),
      })
    },
  })
}

// 기수 프로젝트 목록(정본 §42·§43) — 운영 조회
export function useCohortProjects(
  courseId?: string | null,
  cohortId?: string | null,
) {
  return useQuery({
    queryKey: adminEducationKeys.projects(courseId ?? '', cohortId ?? ''),
    enabled: !!courseId && !!cohortId,
    queryFn: () =>
      apiClient
        .get<
          CohortProject[]
        >(`/admin/courses/${courseId}/cohorts/${cohortId}/projects`)
        .then((r) => r.data),
  })
}

/**
 * 프로젝트 동료 평가 개시/중단 — 매니저·강사 공용.
 * 동료 평가는 프로젝트가 끝난 뒤 진행하므로, 켜는 행위가 개시 신호다(팀원 2명 미만이면 서버가 거부).
 * 경로가 /instructor/* 인 이유는 그쪽만 강사·운영을 함께 허용하기 때문이다(/admin/* 은 강사 배제).
 */
export function usePeerEvalToggle(
  courseId?: string | null,
  cohortId?: string | null,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      enabled,
    }: {
      projectId: string
      enabled: boolean
    }) =>
      apiClient
        .patch<{
          projectId: string
          peerEvalEnabled: boolean
        }>(`/instructor/projects/${projectId}/peer-eval`, { enabled })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.projects(courseId ?? '', cohortId ?? ''),
      })
    },
  })
}
