import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { playKeys } from '../play/queryKeys'
import type { PlayOverview, TypingSession } from '../play/types'

// PLAY 훅 — 엔드포인트가 /student/* 라 학생 feature 소유. baseURL /api 라 경로 앞 /api 생략.
export function usePlayOverview() {
  return useQuery({
    queryKey: playKeys.overview(),
    queryFn: () =>
      apiClient.get<PlayOverview>('/student/play').then((r) => r.data),
  })
}

export function usePlayTyping() {
  return useQuery({
    queryKey: playKeys.typing(),
    queryFn: () =>
      apiClient.get<TypingSession>('/student/play/typing').then((r) => r.data),
  })
}
