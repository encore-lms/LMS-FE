import { useQuery } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type { RecordReviewQueue } from '@/shared/types'

// 학습 기록 검토 큐 — /admin/records/review. MANAGER 단독 1차 검토.
// baseURL이 /api라 경로 앞에 안 붙임.
export function useRecordReviewQueue(filter?: {
  category?: string
  status?: string
}) {
  return useQuery({
    queryKey: adminKeys.recordReviewQueue(filter),
    queryFn: () =>
      apiClient
        .get<RecordReviewQueue>('/admin/records/review', filter)
        .then((r) => r.data),
  })
}
