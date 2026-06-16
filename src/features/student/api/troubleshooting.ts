import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { tsKeys } from '../troubleshooting/queryKeys'
import type { TsCaseDetail, TsListData } from '../troubleshooting/types'

// 트러블슈팅 훅 — 엔드포인트가 /student/* 라 학생 feature 소유. baseURL /api 라 경로 앞 /api 생략.
export function useTsList() {
  return useQuery({
    queryKey: tsKeys.list(),
    queryFn: () =>
      apiClient.get<TsListData>('/student/troubleshooting').then((r) => r.data),
    // 새 사례 제출분(setQueryData)이 세션 내 유지되도록 재요청 억제(새로고침 시 mock 복원).
    staleTime: Infinity,
  })
}

export function useTsCase(id: string) {
  return useQuery({
    queryKey: tsKeys.case(id),
    queryFn: () =>
      apiClient
        .get<TsCaseDetail>(`/student/troubleshooting/${id}`)
        .then((r) => r.data),
  })
}
