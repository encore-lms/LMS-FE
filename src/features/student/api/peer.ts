import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

// 태그 부여(POST /student/peer/tag) — 성공 시 태그보드·허브 갱신
export function useAssignPeerTags() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { targetUserId: string; tags: string[] }) =>
      apiClient.post('/student/peer/tag', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: peerKeys.tag() })
      void qc.invalidateQueries({ queryKey: peerKeys.hub() })
    },
  })
}
// 평판 제출(POST /student/peer/reputation) — 성공 시 평판보드·허브 갱신
export function useSubmitPeerReputation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      targetUserId: string
      technical: number
      responsibility: number
      communication: number
      growth: number
      teamwork: number
      recommendation: string
      comment: string
    }) => apiClient.post('/student/peer/reputation', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: peerKeys.reputation() })
      void qc.invalidateQueries({ queryKey: peerKeys.hub() })
    },
  })
}
