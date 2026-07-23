import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  CohortMaterialItem,
  StudentAttendanceData,
} from '@/shared/types'
import type {
  ResumeDetail,
  ResumeRow,
} from '@/features/admin/education/types'

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
