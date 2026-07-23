import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { CohortMaterialItem } from '@/shared/types'
import type {
  CourseDetail,
  ResumeDetail,
  ResumeRow,
} from '@/features/admin/education/types'

// 강사 과정·기수 허브의 조회 전용 탭(자료실·이력서·설정) — /instructor 미러(운영 /admin/* 은 강사 배제).
// courseId는 서버가 기수에서 해석하므로 cohortId만 넘긴다. baseURL이 /api 라 경로 앞에 /api 안 붙임.
const keys = {
  materials: (cohortId: string) =>
    ['instructor', 'education', 'materials', cohortId] as const,
  resumes: (cohortId: string) =>
    ['instructor', 'education', 'resumes', cohortId] as const,
  resume: (cohortId: string, resumeId: string) =>
    ['instructor', 'education', 'resume', cohortId, resumeId] as const,
  detail: (cohortId: string) =>
    ['instructor', 'education', 'detail', cohortId] as const,
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

// 이력서 탭 — 이력서 상세 + 피드백(조회 전용).
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

// 설정 탭 — HRD-Net 과정 상세.
export function useInstructorCohortDetail(cohortId: string | null) {
  return useQuery({
    queryKey: keys.detail(cohortId ?? ''),
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        .get<CourseDetail>(`/instructor/cohorts/${cohortId}/detail`)
        .then((r) => r.data),
  })
}
