import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { CompetencyCertStatus } from './types'

/**
 * 역량 증명서 심사 API.
 *
 * <p>예전에는 목록 상태가 학생 id 해시로 만든 데모였고 「보완 요청 전송」은 토스트만 띄웠다.
 * 서버가 정본을 갖는다(2026-08-07, learning-service V51).</p>
 */

export interface CertReviewRow {
  studentUserId: string
  status: CompetencyCertStatus
  updatedAt: string
  /** 미해소 보완 요청이 있으면 그 코멘트. */
  pendingComment: string | null
  /** 외부 공개 여부 — BE가 publication 을 함께 조회해 내려준다. */
  published?: boolean
}

const keys = {
  all: ['admin-certificate-review'] as const,
  list: (cohortId: string) => [...keys.all, 'list', cohortId] as const,
}

/** 기수 한 판의 심사 상태 — 행이 없는 수강생은 내려오지 않는다(로스터로 보완한다). */
export function useCertReviewList(cohortId: string | null) {
  return useQuery({
    queryKey: keys.list(cohortId ?? ''),
    enabled: !!cohortId,
    queryFn: () =>
      apiClient
        // apiClient.get 의 둘째 인자는 params 객체 그 자체다 — 한 겹 더 감싸면
        // 쿼리가 실려 가지 않아 400 이 나고 목록이 조용히 비었다(2026-08-07 QA).
        .get<{ rows: CertReviewRow[] }>('/admin/certificates', { cohortId })
        .then((r) => r.data.rows),
  })
}

function useReviewMutation<TBody>(
  path: (studentId: string) => string,
  cohortId: string | null,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, body }: { studentId: string; body?: TBody }) =>
      apiClient.post<CertReviewRow>(path(studentId), body ?? {}).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.list(cohortId ?? '') })
    },
  })
}

/** 재료가 갖춰졌다고 표시 — 기수 종료 자동 판정 외의 수동 경로. */
export function useMarkCertDataReady(cohortId: string | null) {
  return useReviewMutation<never>((id) => `/admin/certificates/${id}/data-ready`, cohortId)
}

/** requested → reviewing. */
export function useStartCertReview(cohortId: string | null) {
  return useReviewMutation<never>((id) => `/admin/certificates/${id}/review`, cohortId)
}

/** 보완 요청 — 코멘트만 보낸다(2026-08-07 결정). */
export function useRequestCertChanges(cohortId: string | null) {
  return useReviewMutation<{ comment: string }>(
    (id) => `/admin/certificates/${id}/change-request`,
    cohortId,
  )
}

/** → certified. */
export function useCertifyCertificate(cohortId: string | null) {
  return useReviewMutation<never>((id) => `/admin/certificates/${id}/certify`, cohortId)
}
