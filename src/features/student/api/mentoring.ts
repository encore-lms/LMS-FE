import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mentoringKeys } from '../mentoring/queryKeys'
import type { MentoringData } from '../mentoring/types'

export interface MentoringRequestPayload {
  date: string
  startTime: string
  endTime: string
  placeType: string
  placeDetail: string
  memo?: string
}

// 수강생 멘토링 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useMentoring() {
  return useQuery({
    queryKey: mentoringKeys.detail(),
    queryFn: () =>
      apiClient.get<MentoringData>('/student/mentoring').then((r) => r.data),
  })
}

/**
 * 멘토링 배정 여부만 파생 조회 — 운영 매니저가 이 수강생(팀)에 멘토를 배정했는지.
 * 사이드바 메뉴·대시보드 멘토링 요약의 노출 조건으로 쓴다(같은 queryKey라 캐시 공유).
 * false=미배정 확정, undefined=미확정(로딩/에러) → 호출부는 false일 때만 숨긴다(graceful).
 */
export function useMentoringAssigned(enabled = true) {
  return useQuery({
    queryKey: mentoringKeys.detail(),
    enabled,
    staleTime: 60_000,
    queryFn: () =>
      apiClient.get<MentoringData>('/student/mentoring').then((r) => r.data),
    select: (d) => d.mentor.assigned,
  })
}

export function useCreateMentoringRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MentoringRequestPayload) =>
      apiClient
        .post<MentoringData>('/student/mentoring/requests', payload)
        .then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(mentoringKeys.detail(), data)
    },
  })
}

export function useCancelMentoringRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) =>
      apiClient
        .post<MentoringData>(`/student/mentoring/requests/${requestId}/cancel`)
        .then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(mentoringKeys.detail(), data)
    },
  })
}
