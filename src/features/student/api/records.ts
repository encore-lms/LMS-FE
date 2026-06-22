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
    mutationFn: (input: { title: string; date: string; draft?: boolean }) =>
      apiClient
        .patch<BlogRecord>(`/student/records/study/${recordId}`, input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recordKeys.overview() }),
  })
}

/** (테스트 UI 전용) 운영자 검토 시뮬레이션 — 지정 기록 1건 승인/반려 후 기록실 갱신 */
export function useSimulateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string
      action: 'approve' | 'reject'
    }) =>
      apiClient
        .post<{ record: BlogRecord | null }>('/student/records/sim/review', {
          id,
          action,
        })
        .then((r) => r.data),
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
