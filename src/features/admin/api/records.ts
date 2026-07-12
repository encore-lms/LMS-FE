import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type {
  RecordCategory,
  RecordDecision,
  RecordGrid,
  AdminCertItem,
  RecordReviewActionRequest,
} from '@/shared/types'
import type { RecordSubmissionDetailView } from '../records/detailMeta'

// 검토 상세 — GET /admin/records/review/{recordId} (P0_15_24 API명세: 유형별 분리 endpoint 없음,
// 단일 엔드포인트가 유형별 상세+검토 이력 반환). :submissionId = Record.id(큐 RecordReviewItem.id와 동일 키).
// category는 페이지 세그먼트 검증·캐시 키 용도로만 쓰고 wire 경로에는 넣지 않는다.
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
          `/admin/records/review/${submissionId}`,
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
        }>(
          `/admin/records/review/${recordId}/${ACTION_PATH[decision]}`,
          payload,
        )
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
      // 운영 기록실 그리드(블로그·스터디)·자격증 목록도 갱신 — 처리 즉시 상태 반영
      queryClient.invalidateQueries({ queryKey: adminKeys.recordsGridScope() })
      queryClient.invalidateQueries({
        queryKey: adminKeys.recordsCertificatesScope(),
      })
    },
  })
}

// 운영 기록실 주차 제출 그리드 — GET /admin/records/grid?category=&cohortId=
export function useRecordsGrid(category: string, cohortId?: string | null) {
  return useQuery({
    queryKey: adminKeys.recordsGrid(category, cohortId ?? ''),
    enabled: !!cohortId && category !== 'certificate', // 자격증은 그리드 아닌 목록

    queryFn: () =>
      apiClient
        .get<RecordGrid>('/admin/records/grid', {
          category,
          ...(cohortId ? { cohortId } : {}),
        })
        .then((r) => r.data),
  })
}

// 운영 자격증 목록 — GET /admin/records/certificates?cohortId=
export function useAdminCertificates(cohortId?: string | null) {
  return useQuery({
    queryKey: adminKeys.recordsCertificates(cohortId ?? ''),
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        .get<AdminCertItem[]>('/admin/records/certificates', {
          ...(cohortId ? { cohortId } : {}),
        })
        .then((r) => r.data),
  })
}
