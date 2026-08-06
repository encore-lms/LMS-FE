import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminEducationKeys } from './queryKeys'
import type { WorkspaceData } from '@/features/student/projects/types'
import type { InstructorRecordReviewData } from '@/shared/types'
import type {
  AssignmentFormDetail,
  AssignmentItem,
  AssignmentSubmissionsData,
  CourseDetail,
  InstructorAssignmentList,
  ResumeDetail,
  ResumeRow,
  CohortProject,
  PeerEvalResults,
  StaffStudentEvalEntry,
  StaffStudentEvalSheet,
  StaffEvalAllData,
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
/**
 * 검토자 프로젝트 워크스페이스 상세(운영) — GET /admin/projects/{id}/workspace.
 * 응답은 수강생 워크스페이스(WorkspaceData)와 한 계약 — 화면을 읽기 전용으로 재사용한다.
 */
export function useAdminProjectWorkspace(projectId?: string | null) {
  return useQuery({
    queryKey: [...adminEducationKeys.all, 'project-workspace', projectId ?? ''],
    enabled: !!projectId,
    queryFn: () =>
      apiClient
        .get<WorkspaceData>(`/admin/projects/${projectId}/workspace`)
        .then((r) => r.data),
  })
}

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
/**
 * 프로젝트 종료/재개 — 매니저·강사 공용. 인증 승인과 별개로 상태만 바꾼다.
 *
 * <p>동료 평가는 완료된 프로젝트에서만 열 수 있는데, 완료로 가는 길이 강사의 인증 승인뿐이라
 * 인증할 산출물이 아직 없으면 기간이 끝나도 평가를 열 수 없었다.</p>
 */
export function useProjectCompletion(
  courseId?: string | null,
  cohortId?: string | null,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      completed,
    }: {
      projectId: string
      completed: boolean
    }) =>
      apiClient
        .patch<{
          projectId: string
          projectStatus: string
        }>(`/instructor/projects/${projectId}/completion`, { completed })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminEducationKeys.projects(courseId ?? '', cohortId ?? ''),
      })
    },
  })
}

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

/**
 * 동료 평가 결과 — 누가 누구를 어떻게 평가했는지, 아직 안 낸 사람은 누구인지.
 * 여닫는 버튼만 있고 안을 볼 수단이 없으면 운영자는 평가가 되고 있는지조차 모른다.
 */
export function usePeerEvaluations(projectId: string | null) {
  return useQuery({
    queryKey: adminEducationKeys.peerEvaluations(projectId ?? ''),
    queryFn: () =>
      apiClient
        .get<PeerEvalResults>(
          `/instructor/projects/${projectId}/peer-evaluations`,
        )
        .then((r) => r.data),
    enabled: !!projectId,
  })
}

/**
 * 수강생 평가('수강생 평가' 탭, 2026-08-06 신설) — 강사·매니저가 담당 기수 전체 수강생을
 * 4축(shared EVALUATION_AXIS_LABELS 순서)으로 평가한다. 시트는 로스터 전체 + 평가자 본인 저장분.
 */
export function useStaffStudentEvals(cohortId: string | null) {
  return useQuery({
    queryKey: adminEducationKeys.staffStudentEvals(cohortId ?? ''),
    queryFn: () =>
      apiClient
        .get<StaffStudentEvalSheet>(
          `/users/cohorts/${cohortId}/student-evaluations`,
        )
        .then((r) => r.data),
    enabled: !!cohortId,
  })
}

/** 수강생 1명 저장(재저장=덮어쓰기) — 전 축 1~5 필수, 코멘트 선택. 성공 시 시트 갱신. */
export function useSaveStaffStudentEval(cohortId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      studentId: string
      scores: number[]
      comment?: string
    }) =>
      apiClient
        .put<StaffStudentEvalEntry>(
          `/users/cohorts/${cohortId}/student-evaluations/${input.studentId}`,
          { scores: input.scores, comment: input.comment ?? '' },
        )
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminEducationKeys.staffStudentEvals(cohortId),
      })
    },
  })
}

/** 스태프 평가 전 평가자 조회('수강생 종합 데이터' 탭) — 강사·매니저 저장분을 수강생별로 모아 본다. */
export function useStaffStudentEvalsAll(cohortId: string | null) {
  return useQuery({
    queryKey: [
      ...adminEducationKeys.staffStudentEvals(cohortId ?? ''),
      'all',
    ] as const,
    queryFn: () =>
      apiClient
        .get<StaffEvalAllData>(
          `/users/cohorts/${cohortId}/student-evaluations/all`,
        )
        .then((r) => r.data),
    enabled: !!cohortId,
  })
}

/**
 * 출결 요약('수강생 종합 데이터' 탭) — 지각·결석 이슈 수강생만 쓴다.
 * 강사 feature 훅과 같은 엔드포인트지만 교차 api 임포트가 린트로 막혀 admin 로컬 훅으로 둔다.
 */
export function useCohortAttendanceIssues(cohortId: string | null) {
  return useQuery({
    queryKey: [
      ...adminEducationKeys.all,
      'attendance-issues',
      cohortId ?? '',
    ] as const,
    queryFn: () =>
      apiClient
        .get<{
          issues: {
            studentUuid: string
            name: string
            lateCount: number
            absentCount: number
          }[]
        }>(`/instructor/cohorts/${cohortId}/attendance-summary`)
        .then((r) => r.data),
    enabled: !!cohortId,
  })
}

/** 기록실 그리드('수강생 종합 데이터' 탭) — 수강생별 블로그/스터디/자격증 진행 요약용(admin 미러). */
export function useAdminRecordGrid(cohortId: string | null) {
  return useQuery({
    queryKey: [
      ...adminEducationKeys.all,
      'record-grid',
      cohortId ?? '',
    ] as const,
    queryFn: () =>
      apiClient
        .get<InstructorRecordReviewData>('/admin/records/review-grid', {
          cohortId: cohortId ?? undefined,
        })
        .then((r) => r.data),
    enabled: !!cohortId,
  })
}
