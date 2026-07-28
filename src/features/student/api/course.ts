import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { courseKeys } from '../course/queryKeys'
import type {
  CourseHome,
  CourseMaterials,
  MaterialItem,
  ShareMaterialInput,
  UpdateMaterialInput,
} from '../course/types'
import type {
  AssignmentDetail,
  AssignmentListItem,
  AssignmentSubmitInput,
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
    mutationFn: (input: ShareMaterialInput) => {
      // 파일이 있으면 multipart 로 보낸다 — JSON 으로는 바이트가 실리지 않아 다운로드가 404였다.
      if (input.file) {
        const form = new FormData()
        form.append('title', input.title)
        form.append('fileType', input.fileType)
        if (input.body) form.append('body', input.body)
        form.append('file', input.file)
        return apiClient
          .postForm<MaterialItem>('/student/course/materials/file', form)
          .then((r) => r.data)
      }
      return apiClient
        .post<MaterialItem>('/student/course/materials', input)
        .then((r) => r.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.materials() }),
  })
}

/** 자료 삭제 — 본인 공유 자료만 삭제(서버에서도 검증) 후 목록 갱신 */
/**
 * 자료 수정 — PATCH /student/course/materials/{id} (multipart).
 * 파일 교체와 글 수정이 한 폼에서 일어나 multipart 하나로 보낸다.
 * 넘기지 않은 항목은 서버가 기존 값을 유지하므로, 안 고친 칸을 빈 값으로 밀지 않는다.
 */
export function useUpdateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateMaterialInput) => {
      const form = new FormData()
      if (input.title !== undefined) form.append('title', input.title)
      if (input.body !== undefined) form.append('body', input.body)
      if (input.fileUrl) form.append('fileUrl', input.fileUrl)
      if (input.file) form.append('file', input.file)
      return apiClient.patchForm<void>(
        `/student/course/materials/${input.id}`,
        form,
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.materials() }),
  })
}

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

/** 과제 제출/재제출 — 성공 후 상세·목록·홈 캐시를 다시 불러온다. */
export function useSubmitAssignment(assignmentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AssignmentSubmitInput) =>
      apiClient.postNoContent(
        `/student/course/assignments/${assignmentId}/submission`,
        input,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: courseKeys.assignment(assignmentId),
      })
      void qc.invalidateQueries({ queryKey: courseKeys.assignments() })
      void qc.invalidateQueries({ queryKey: courseKeys.home() })
    },
  })
}
