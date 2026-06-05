import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { recordKeys } from '../records/queryKeys'
import type { BlogFormData, RecordsOverview } from '../records/types'

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
