import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminPlayKeys } from './queryKeys'
import type { PlayOverview } from './types'

// PLAY 타자 관리 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function usePlayTypingTexts() {
  return useQuery({
    queryKey: adminPlayKeys.overview(),
    queryFn: () =>
      apiClient
        .get<PlayOverview>('/admin/play/typing-texts')
        .then((r) => r.data),
  })
}
