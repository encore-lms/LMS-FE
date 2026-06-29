import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { courseKeys } from '../course/queryKeys'
import type {
  CourseHome,
  CourseMaterials,
  MaterialItem,
  ShareMaterialInput,
} from '../course/types'
import type {
  AssignmentDetail,
  AssignmentListItem,
} from '../course/assignments/types'
import type { OnlineCourse } from '../course/online/types'

// 수강생 "나의 과정" 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).

/** 강의 홈 — /student/course */
export function useCourseHome() {
  return useQuery({
    queryKey: courseKeys.home(),
    queryFn: () =>
      apiClient.get<CourseHome>('/student/course').then((r) => r.data),
  })
}

/** 온라인 교육(KDC) — /student/course/online */
export function useOnlineCourse() {
  return useQuery({
    queryKey: courseKeys.online(),
    queryFn: () =>
      apiClient.get<OnlineCourse>('/student/course/online').then((r) => r.data),
  })
}

/** 강의 자료실 — /student/course/materials */
export function useCourseMaterials() {
  return useQuery({
    queryKey: courseKeys.materials(),
    queryFn: () =>
      apiClient
        .get<CourseMaterials>('/student/course/materials')
        .then((r) => r.data),
  })
}

/** 자료 파일 다운로드 — 운영 중 기수의 파일형 자료(Blob 받아 저장 트리거). */
export async function downloadCourseMaterialFile(id: string, fileName: string) {
  const blob = await apiClient.getBlob(`/student/course/materials/${id}/file`)
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

/** 자료 공유 — 학생 공유 자료 등록 후 목록 갱신(invalidate) */
export function useShareMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ShareMaterialInput) =>
      apiClient
        .post<MaterialItem>('/student/course/materials', input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.materials() }),
  })
}

/** 자료 삭제 — 본인 공유 자료만 삭제(서버에서도 검증) 후 목록 갱신 */
export function useDeleteMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient
        .delete<{ id: string }>(`/student/course/materials/${id}`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.materials() }),
  })
}

/** 과제/실습 목록 — /student/course/assignments */
export function useAssignments() {
  return useQuery({
    queryKey: courseKeys.assignments(),
    queryFn: () =>
      apiClient
        .get<AssignmentListItem[]>('/student/course/assignments')
        .then((r) => r.data),
  })
}

/** 과제 상세·제출 — /student/course/assignments/:id */
export function useAssignment(id: string) {
  return useQuery({
    queryKey: courseKeys.assignment(id),
    queryFn: () =>
      apiClient
        .get<AssignmentDetail>(`/student/course/assignments/${id}`)
        .then((r) => r.data),
    enabled: !!id,
  })
}
