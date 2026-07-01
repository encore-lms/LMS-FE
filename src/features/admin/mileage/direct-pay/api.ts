import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileageDirectPayKeys } from './queryKeys'
import type { DirectPayData, DirectPayInput, DirectPayResult } from './types'

// 마일리지 직접 지급 대상 명단 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useDirectPayRoster() {
  return useQuery({
    queryKey: mileageDirectPayKeys.roster(),
    queryFn: () =>
      apiClient
        .get<DirectPayData>('/admin/mileage/direct-pay')
        .then((r) => r.data),
  })
}

// 일괄 지급/차감 실행 훅 — POST /admin/mileage/direct-pay (EARN/SPEND). 성공 시 명단 재조회.
export function useDirectPaySubmit() {
  const queryClient = useQueryClient()
  return useMutation<DirectPayResult, Error, DirectPayInput>({
    mutationFn: (input) =>
      apiClient
        .post<DirectPayResult>('/admin/mileage/direct-pay', input)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mileageDirectPayKeys.roster() })
    },
  })
}
