import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type {
  RecordCategory,
  RecordDecision,
  RecordReviewActionRequest,
  RecordReviewQueue,
} from '@/shared/types'
import {
  RECORD_SEGMENT_BY_CATEGORY,
  type RecordSubmissionDetailView,
} from '../records/detailMeta'

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

// 검토 상세 — GET /admin/records/{blog|study|certificates}/:submissionId.
// :submissionId = Record.id(큐 RecordReviewItem.id와 동일 키).
export function useRecordSubmissionDetail(
  category: RecordCategory,
  submissionId: string,
) {
  return useQuery({
    queryKey: adminKeys.recordSubmissionDetail(category, submissionId),
    enabled: !!submissionId,
    queryFn: () =>
      apiClient
        .get<RecordSubmissionDetailView>(
          `/admin/records/${RECORD_SEGMENT_BY_CATEGORY[category]}/${submissionId}`,
        )
        .then((r) => r.data),
  })
}

// 결정 → API 액션 세그먼트 (P0_15_24 API명세: approve / request-changes / reject)
const ACTION_PATH: Record<RecordDecision, string> = {
  approve: 'approve',
  changes: 'request-changes',
  reject: 'reject',
}

export interface RecordReviewActionVariables {
  recordId: string
  category: RecordCategory
  decision: RecordDecision
  payload: RecordReviewActionRequest
}

/**
 * 검토 처리 mutation — POST /admin/records/review/:recordId/{approve|request-changes|reject}.
 * 반려·보완은 studentVisibleComment 필수(누락 시 422 REVIEW_REASON_REQUIRED — FE는 버튼 disabled로 선차단).
 * 성공 시 검토 큐 + 해당 상세 캐시 무효화(adminKeys SSOT).
 */
export function useRecordReviewAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      recordId,
      decision,
      payload,
    }: RecordReviewActionVariables) =>
      apiClient
        .post<{
          id: string
          status: string
        }>(`/admin/records/review/${recordId}/${ACTION_PATH[decision]}`, payload)
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.recordReviewQueue(),
      })
      queryClient.invalidateQueries({
        queryKey: adminKeys.recordSubmissionDetail(
          vars.category,
          vars.recordId,
        ),
      })
    },
  })
}
