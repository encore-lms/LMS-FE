import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type {
  CertReviewQueue,
  CertReviewDetail,
  CertReviewStatus,
  CertSnapshot,
} from '@/shared/types'

// 인증 검토 큐 — /admin/* 엔드포인트라 admin feature 소유. baseURL이 /api라 경로 앞에 안 붙임.
export function useReviewQueue(filter?: { status?: string }) {
  return useQuery({
    queryKey: adminKeys.reviewQueue(filter),
    queryFn: () =>
      apiClient
        .get<CertReviewQueue>('/admin/certificates/reviews', filter)
        .then((r) => r.data),
  })
}

// 인증 검토 상세.
export function useReviewDetail(reviewId: string) {
  return useQuery({
    queryKey: adminKeys.reviewDetail(reviewId),
    queryFn: () =>
      apiClient
        .get<CertReviewDetail>(`/admin/certificates/reviews/${reviewId}`)
        .then((r) => r.data),
    enabled: !!reviewId,
  })
}

// 동결 스냅샷 상세.
export function useSnapshot(certificateId: string) {
  return useQuery({
    queryKey: adminKeys.snapshot(certificateId),
    queryFn: () =>
      apiClient
        .get<CertSnapshot>(`/admin/certificates/${certificateId}/snapshot`)
        .then((r) => r.data),
    enabled: !!certificateId,
  })
}

/** 인증 검토 처리 입력 — 승인(certified) / 보완 요청(changes_requested) */
export interface ReviewActionInput {
  reviewId: string
  next: Extract<CertReviewStatus, 'certified' | 'changes_requested'>
}

// 인증 검토 처리 훅 — 성공 시 검토 큐의 해당 건 상태를 전이하고 byStatus 카운트를 재계산 + 상세 상태 갱신.
// 실제 처리(CertificateSnapshot 생성·동결)는 로드맵상 S6(7월) BE 작업 → 네트워크 없이 클라이언트 큐 전이만 시뮬레이션한다.
// 계약 확정 시 mutationFn 을 apiClient.post('/admin/certificates/reviews/:id/{approve|request-changes}') 로 교체한다.
export function useReviewAction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, ReviewActionInput>({
    mutationFn: async () => {},
    onSuccess: (_result, { reviewId, next }) => {
      queryClient.setQueryData<CertReviewQueue>(
        adminKeys.reviewQueue(),
        (prev) => {
          if (!prev) return prev
          const items = prev.items.map((it) =>
            it.id === reviewId ? { ...it, status: next } : it,
          )
          const byStatus = items.reduce(
            (acc, it) => {
              acc[it.status] += 1
              return acc
            },
            {
              requested: 0,
              reviewing: 0,
              changes_requested: 0,
              certified: 0,
            } as Record<CertReviewStatus, number>,
          )
          return { ...prev, items, byStatus }
        },
      )
      queryClient.setQueryData<CertReviewDetail>(
        adminKeys.reviewDetail(reviewId),
        (prev) => (prev ? { ...prev, status: next } : prev),
      )
    },
  })
}
