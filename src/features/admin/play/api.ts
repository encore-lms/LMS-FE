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

/** 제시문 생성·수정 공용 바디 — BE PassageWriteRequest 계약. */
export interface PassageWriteBody {
  title: string
  content: string
  language: string
  level: string
  order: number
  active: boolean
}

// 제시문 추가·수정 — 실 API(POST/PATCH). 성공 시 목록을 무효화해 서버 산출(요약 카운트 포함)로 갱신한다.
// 예전에는 BE 미확정이라 네트워크 없이 캐시 반영만 해 새로고침하면 사라졌다.
export function useUpsertPassage() {
  const queryClient = useQueryClient()
  return useMutation<TypingPassage, Error, { id: string | null; body: PassageWriteBody }>({
    mutationFn: ({ id, body }) =>
      (id
        ? apiClient.patch<TypingPassage>(`/admin/play/typing-texts/${id}`, body)
        : apiClient.post<TypingPassage>('/admin/play/typing-texts', body)
      ).then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminPlayKeys.overview() }),
  })
}
