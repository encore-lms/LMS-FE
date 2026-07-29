import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { recordKeys } from '../records/queryKeys'
import type {
  BlogFormData,
  BlogRecord,
  CertFormData,
  CertType,
  CreateBlogRecordInput,
  CreateCertRecordInput,
  CreateStudyRecordInput,
  RecordsOverview,
  StudyFormData,
} from '../records/types'

// 기록실 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useRecordsOverview() {
  return useQuery({
    queryKey: recordKeys.overview(),
    queryFn: () =>
      apiClient.get<RecordsOverview>('/student/records').then((r) => r.data),
  })
}

/** 블로그 등록 폼 — 주차 그리드(생성) */
export function useBlogForm() {
  return useQuery({
    queryKey: recordKeys.blogForm(),
    queryFn: () =>
      apiClient
        .get<BlogFormData>('/student/records/blog-form')
        .then((r) => r.data),
  })
}

/** 블로그 수정 폼 — 반려 기록 프리필 */
export function useBlogRecord(recordId: string) {
  return useQuery({
    queryKey: recordKeys.blog(recordId),
    queryFn: () =>
      apiClient
        .get<BlogFormData>(`/student/records/blog/${recordId}`)
        .then((r) => r.data),
  })
}

/** 스터디 수정 폼 — 기존 기록 프리필 */
export function useStudyRecord(recordId: string) {
  return useQuery({
    queryKey: recordKeys.study(recordId),
    queryFn: () =>
      apiClient
        .get<StudyFormData>(`/student/records/study/${recordId}`)
        .then((r) => r.data),
  })
}

/** 자격증 수정 폼 — 기존 기록 프리필 */
export function useCertRecord(recordId: string) {
  return useQuery({
    queryKey: recordKeys.cert(recordId),
    queryFn: () =>
      apiClient
        .get<CertFormData>(`/student/records/certificate/${recordId}`)
        .then((r) => r.data),
  })
}

/** 블로그 기록 등록 — 목록에 추가 후 기록실 갱신(invalidate) */
export function useCreateBlogRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBlogRecordInput) =>
      apiClient
        .post<BlogRecord>('/student/records/blog', input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recordKeys.overview() }),
  })
}

/** 스터디 기록 등록 — 목록에 추가 후 기록실 갱신(invalidate) */
export function useCreateStudyRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateStudyRecordInput) =>
      apiClient
        .post<BlogRecord>('/student/records/study', input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recordKeys.overview() }),
  })
}

/** 자격증 기록 등록 — 목록에 추가(draft면 작성 중) 후 기록실 갱신(invalidate) */
export function useCreateCertRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCertRecordInput) =>
      apiClient
        .post<BlogRecord>('/student/records/certificate', input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recordKeys.overview() }),
  })
}

/** 블로그 기록 수정(재제출) — 변경 반영 + 검토 중 전환 후 기록실 갱신 */
export function useUpdateBlogRecord(recordId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { url: string; title?: string }) =>
      apiClient
        .patch<BlogRecord>(`/student/records/blog/${recordId}`, input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recordKeys.overview() }),
  })
}

/** 스터디 기록 수정(재제출) — 변경 반영 + 검토 중 전환 후 기록실 갱신 */
export function useUpdateStudyRecord(recordId: string) {
  const qc = useQueryClient()
  return useMutation({
    // BE UpdateStudyRequest 는 시간·활동 내역까지 받는다.
    // 예전에는 title·date 만 보내서 수정 저장 시 활동 내역이 비워졌다.
    mutationFn: (input: {
      title: string
      date: string
      startTime?: string
      endTime?: string
      body?: string
      draft?: boolean
    }) =>
      apiClient
        .patch<BlogRecord>(`/student/records/study/${recordId}`, input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recordKeys.overview() }),
  })
}

/** 기록 삭제(실 BE) — 삭제 후 기록실 갱신 */
export function useDeleteRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (recordId: string) =>
      apiClient.delete(`/student/records/${recordId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: recordKeys.overview() }),
  })
}

/** 자격증 기록 수정(재제출) — 변경 반영 + 검토 중 전환 후 기록실 갱신 */
export function useUpdateCertRecord(recordId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      certType: CertType
      title: string
      otherCertName?: string
      draft?: boolean
    }) =>
      apiClient
        .patch<BlogRecord>(`/student/records/certificate/${recordId}`, input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recordKeys.overview() }),
  })
}

// ── 기록 증빙 첨부(learning-service) ──
// 그동안 화면에서 파일을 고를 수는 있었지만 서버로 보내는 경로가 없어 저장되지 않았다.
export function useUploadRecordAttachments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) => {
      const form = new FormData()
      for (const f of files) form.append('files', f)
      return apiClient.postForm<void>(`/student/records/${id}/attachments`, form)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: recordKeys.all }),
  })
}

export function useDeleteRecordAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      apiClient.delete<void>(
        `/student/records/${id}/attachments/${attachmentId}`,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: recordKeys.all }),
  })
}

/** 증빙 내려받기 — 본인 또는 담당 기수 운영·강사. */
export async function downloadRecordAttachment(
  attachmentId: string,
  fileName: string,
) {
  const blob = await apiClient.getBlob(
    `/student/records/attachments/${attachmentId}/file`,
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
