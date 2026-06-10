import { useQuery } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  Endorsement,
  EndorsementHistory,
  EndorsementQueue,
} from '@/shared/types'

// 강사 추천서 — /instructor/endorsements 묶음. baseURL이 /api라 경로 앞에 안 붙임.

// 목록/작성 화면: 작성 대기 카드 + 최근 작성 추천서.
export function useEndorsementQueue() {
  return useQuery({
    queryKey: instructorKeys.endorsements(),
    queryFn: () =>
      apiClient
        .get<EndorsementQueue>('/instructor/endorsements')
        .then((r) => r.data),
  })
}

// 전체 보기: 누적 추천서 큐 + KPI.
export function useEndorsementHistory() {
  return useQuery({
    queryKey: instructorKeys.endorsementHistory(),
    queryFn: () =>
      apiClient
        .get<EndorsementHistory>('/instructor/endorsements/history')
        .then((r) => r.data),
  })
}

// 상세/수정: 추천서 1건.
export function useEndorsement(endorsementId: string) {
  return useQuery({
    queryKey: instructorKeys.endorsementDetail(endorsementId),
    queryFn: () =>
      apiClient
        .get<Endorsement>(`/instructor/endorsements/${endorsementId}`)
        .then((r) => r.data),
    enabled: Boolean(endorsementId),
  })
}
