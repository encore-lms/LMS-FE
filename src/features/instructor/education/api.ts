import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { CohortProject } from '@/features/admin/education/types'
import type { WorkspaceData } from '@/features/student/projects/types'
import type {
  CohortMaterialItem,
  StudentAttendanceData,
  ResumeDetail,
  ResumeRow,
} from '@/shared/types'

// 수강생 탭 출석 현황 요약(BE CohortAttendanceSummaryResponse 미러).
export interface CohortAttendanceSummary {
  cohortLabel: string
  date: string
  students: { total: number; active: number; dropout: number }
  todayPresent: number | null
  todayTotal: number | null
  todayAbsentees: { studentUuid: string; name: string; detail: string }[]
  avgRate: number | null
  weekly: { date: string; rate: number }[]
  issues: {
    studentUuid: string
    name: string
    lateCount: number
    absentCount: number
    marks: string[]
  }[]
  issueDays: string[]
}

// 강사 과정·기수 허브의 조회 전용 탭(자료실·이력서·설정) — /instructor 미러(운영 /admin/* 은 강사 배제).
// courseId는 서버가 기수에서 해석하므로 cohortId만 넘긴다. baseURL이 /api 라 경로 앞에 /api 안 붙임.
const keys = {
  materials: (cohortId: string) =>
    ['instructor', 'education', 'materials', cohortId] as const,
  resumes: (cohortId: string) =>
    ['instructor', 'education', 'resumes', cohortId] as const,
  resume: (cohortId: string, resumeId: string) =>
    ['instructor', 'education', 'resume', cohortId, resumeId] as const,
  attendance: (cohortId: string) =>
    ['instructor', 'education', 'attendance', cohortId] as const,
  attendanceSummary: (cohortId: string) =>
    ['instructor', 'education', 'attendance-summary', cohortId] as const,
}

// 수강생 탭 — 오늘 출석(HRD 라이브, date 미지정=오늘). 명단도 이 rows(HRD 훈련생)에서 파생.
export function useInstructorAttendance(
  cohortId: string | null,
  date?: string,
) {
  return useQuery({
    queryKey: [...keys.attendance(cohortId ?? ''), date ?? 'today'] as const,
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        .get<StudentAttendanceData>(
          `/instructor/cohorts/${cohortId}/attendance`,
          { date: date || undefined },
        )
        .then((r) => r.data),
  })
}

// 수강생 탭 — 출석 현황 요약.
export function useInstructorAttendanceSummary(cohortId: string | null) {
  return useQuery({
    queryKey: keys.attendanceSummary(cohortId ?? ''),
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        .get<CohortAttendanceSummary>(
          `/instructor/cohorts/${cohortId}/attendance-summary`,
        )
        .then((r) => r.data),
  })
}

// 자료실 탭 — 기수 자료 목록.
export function useInstructorMaterials(cohortId: string | null) {
  return useQuery({
    queryKey: keys.materials(cohortId ?? ''),
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        .get<CohortMaterialItem[]>(`/instructor/cohorts/${cohortId}/materials`)
        .then((r) => r.data),
  })
}

// 자료실 탭 — 자료 등록(강사 담당 기수, 2026-08-03 개방). 운영 훅과 같은 multipart 계약.
export function useCreateInstructorMaterial(cohortId: string) {
  const qc = useQueryClient()
  return useMutation<
    CohortMaterialItem,
    Error,
    {
      title: string
      body?: string
      materialType: string
      url?: string
      file?: File
    }
  >({
    mutationFn: ({ title, body, materialType, url, file }) => {
      const form = new FormData()
      form.append('title', title)
      form.append('materialType', materialType)
      if (body) form.append('body', body)
      if (url) form.append('url', url)
      if (file) form.append('file', file)
      // multipart 전송은 postForm — Content-Type을 비워 boundary를 자동 설정(운영 훅과 동일).
      return apiClient
        .postForm<CohortMaterialItem>(
          `/instructor/cohorts/${cohortId}/materials`,
          form,
        )
        .then((r) => r.data)
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.materials(cohortId) }),
  })
}

// 자료실 탭 — 자료 삭제(강사는 본인 등록분만, BE 가드).
export function useDeleteInstructorMaterial(cohortId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (materialId) =>
      apiClient
        .delete<void>(`/instructor/cohorts/${cohortId}/materials/${materialId}`)
        .then(() => undefined),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.materials(cohortId) }),
  })
}

// 자료실 탭 — 파일형 자료 다운로드(브라우저 앵커).
export async function downloadInstructorMaterialFile(
  cohortId: string,
  materialId: string,
  fileName: string,
) {
  const blob = await apiClient.getBlob(
    `/instructor/cohorts/${cohortId}/materials/${materialId}/file`,
  )
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

// 이력서 탭 — 기수 이력서 현황.
export function useInstructorResumes(cohortId: string | null) {
  return useQuery({
    queryKey: keys.resumes(cohortId ?? ''),
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        .get<ResumeRow[]>(`/instructor/cohorts/${cohortId}/resumes`)
        .then((r) => r.data),
  })
}

// 이력서 탭 — 이력서 상세 + 피드백.
export function useInstructorResume(
  cohortId: string | null,
  resumeId: string | null,
) {
  return useQuery({
    queryKey: keys.resume(cohortId ?? '', resumeId ?? ''),
    enabled: !!cohortId && !!resumeId,
    queryFn: () =>
      apiClient
        .get<ResumeDetail>(
          `/instructor/cohorts/${cohortId}/resumes/${resumeId}`,
        )
        .then((r) => r.data),
  })
}

// 이력서 탭 — 피드백 작성(담당 기수 강사). BE는 requireCohortReviewer로 타 기수를 403 처리.
export function useAddInstructorResumeFeedback() {
  const qc = useQueryClient()
  return useMutation<
    void,
    Error,
    { cohortId: string; resumeId: string; body: string }
  >({
    mutationFn: ({ cohortId, resumeId, body }) =>
      apiClient
        .post<void>(
          `/instructor/cohorts/${cohortId}/resumes/${resumeId}/feedback`,
          { body },
        )
        .then(() => undefined),
    onSuccess: (_d, { cohortId, resumeId }) => {
      qc.invalidateQueries({ queryKey: keys.resume(cohortId, resumeId) })
      qc.invalidateQueries({ queryKey: keys.resumes(cohortId) })
    },
  })
}

// 이력서 탭 — 피드백 삭제. BE는 작성자 본인·운영자만 허용(그 외 403).
export function useDeleteInstructorResumeFeedback() {
  const qc = useQueryClient()
  return useMutation<
    void,
    Error,
    { cohortId: string; resumeId: string; feedbackId: string }
  >({
    mutationFn: ({ cohortId, resumeId, feedbackId }) =>
      apiClient
        .delete<void>(
          `/instructor/cohorts/${cohortId}/resumes/${resumeId}/feedback/${feedbackId}`,
        )
        .then(() => undefined),
    onSuccess: (_d, { cohortId, resumeId }) => {
      qc.invalidateQueries({ queryKey: keys.resume(cohortId, resumeId) })
      qc.invalidateQueries({ queryKey: keys.resumes(cohortId) })
    },
  })
}

/**
 * 강사 기수 프로젝트 목록 미러 — GET /instructor/cohorts/{cohortId}/projects.
 * 운영 목록(CohortProject)과 한 계약 — ProjectsPane이 양 역할을 한 화면으로 서빙(2026-08-05).
 */
export function useInstructorCohortProjects(cohortId?: string | null) {
  return useQuery({
    queryKey: ['instructor', 'education', 'projects', cohortId ?? ''],
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        .get<CohortProject[]>(`/instructor/cohorts/${cohortId}/projects`)
        .then((r) => r.data),
  })
}

/**
 * 강사 프로젝트 워크스페이스 상세 미러 — GET /instructor/projects/{id}/workspace.
 * 담당 기수만(BE requireCohortReviewer, 타 기수 403). 응답은 수강생 워크스페이스와 한 계약.
 */
export function useInstructorProjectWorkspace(projectId?: string | null) {
  return useQuery({
    queryKey: ['instructor', 'education', 'project-workspace', projectId ?? ''],
    enabled: !!projectId,
    queryFn: () =>
      apiClient
        .get<WorkspaceData>(`/instructor/projects/${projectId}/workspace`)
        .then((r) => r.data),
  })
}
