import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { peerKeys } from '../peer/queryKeys'
import type { PeerHubData, PeerRepData, PeerTagData } from '../peer/types'

// 동료 평가 훅 — 엔드포인트가 /student/* 라 학생 feature 소유. baseURL /api 라 경로 앞 /api 생략.
export function usePeerHub() {
  return useQuery({
    queryKey: peerKeys.hub(),
    queryFn: () =>
      apiClient.get<PeerHubData>('/student/peer/hub').then((r) => r.data),
  })
}
export function usePeerTag() {
  return useQuery({
    queryKey: peerKeys.tag(),
    queryFn: () =>
      apiClient.get<PeerTagData>('/student/peer/tag').then((r) => r.data),
  })
}
export function usePeerReputation() {
  return useQuery({
    queryKey: peerKeys.reputation(),
    queryFn: () =>
      apiClient
        .get<PeerRepData>('/student/peer/reputation')
        .then((r) => r.data),
  })
}
