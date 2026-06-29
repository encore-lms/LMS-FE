import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminEducationKeys } from './queryKeys'
import type {
  AssignmentItem,
  CourseDetail,
  EducationOverview,
  ResumeDetail,
  ResumeRow,
} from './types'

// 과정·기수·교과목 통합 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useEducationOverview() {
  return useQuery({
    queryKey: adminEducationKeys.overview(),
    queryFn: () =>
      apiClient.get<EducationOverview>('/admin/education').then((r) => r.data),
  })
}

// 설명 탭 — HRD-Net 과정 상세(learning-service). 과정/기수 둘 다 있어야 조회.
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

export interface CreateAssignmentInput {
  courseId: string
  cohortId: string
  title: string
  description?: string
  dueAt?: string
}
export function useCreateAssignment() {
  const queryClient = useQueryClient()
  return useMutation<AssignmentItem, Error, CreateAssignmentInput>({
    mutationFn: ({ courseId, cohortId, title, description, dueAt }) =>
      apiClient
        .post<AssignmentItem>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/assignments`,
          { title, description, dueAt },
        )
        .then((r) => r.data),
    onSuccess: (_d, { courseId, cohortId }) =>
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.assignments(courseId, cohortId),
      }),
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
