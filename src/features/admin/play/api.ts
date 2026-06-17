import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminPlayKeys } from './queryKeys'
import type { PlayOverview, TypingPassage } from './types'

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

// 추가/수정 후 활성·비활성·오류 카운트를 재계산한다(목록 갱신).
function recount(passages: TypingPassage[], prev: PlayOverview): PlayOverview {
  const by = (s: TypingPassage['status']) =>
    passages.filter((p) => p.status === s).length
  return {
    ...prev,
    passages,
    summary: {
      ...prev.summary,
      active: by('active'),
      inactive: by('inactive'),
      error: by('error'),
    },
  }
}

// 제시문 추가·수정 훅 — 성공 시 목록 캐시에 추가(신규) 또는 교체(수정) + 카운트 재계산.
// BE 계약(P0_15 GameContent) 미확정 → 네트워크 없이 클라이언트 낙관 반영으로 시뮬레이션한다.
// 계약 확정 시 mutationFn 을 apiClient.post/patch('/admin/play/typing-texts', ...) 로 교체한다.
export function useUpsertPassage() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, TypingPassage>({
    mutationFn: async () => {},
    onSuccess: (_result, passage) => {
      queryClient.setQueryData<PlayOverview>(
        adminPlayKeys.overview(),
        (prev) => {
          if (!prev) return prev
          const exists = prev.passages.some((p) => p.id === passage.id)
          const passages = exists
            ? prev.passages.map((p) => (p.id === passage.id ? passage : p))
            : [passage, ...prev.passages]
          return recount(passages, prev)
        },
      )
    },
  })
}
