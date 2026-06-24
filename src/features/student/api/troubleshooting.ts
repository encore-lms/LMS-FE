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
    // staleTime만으로는 부족 — 목록을 떠나 옵저버가 사라지면 gcTime(기본 5분) 후 캐시가
    // 수거되고, 재진입 시 mock 시드로 리패치돼 캐시에만 있던 신규 사례가 사라진다.
    // (변경 제안 승인처럼 목록을 오래 비우는 흐름에서 두드러짐.) 세션 내 보존 위해 GC 비활성화.
    gcTime: Infinity,
  })
}

export function useTsCase(id: string) {
  return useQuery({
    queryKey: tsKeys.case(id),
    queryFn: () =>
      apiClient
        .get<TsCaseDetail>(`/student/troubleshooting/${id}`)
        .then((r) => r.data),
    // 새 사례 작성 시 시드한 상세(setQueryData)와 인증 요청 상태 전환이 세션 내
    // 유지되도록 재요청 억제(새로고침 시 mock 복원) — 목록(useTsList)과 동일 정책.
    staleTime: Infinity,
    // 옵저버가 사라져도 캐시가 수거되지 않도록 GC 비활성화(목록과 동일 — 신규 사례 소실 방지).
    gcTime: Infinity,
  })
}
