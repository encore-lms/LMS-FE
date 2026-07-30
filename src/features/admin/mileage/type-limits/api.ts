import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileageTypeLimitsKeys } from './queryKeys'
import type { TypeLimitsData } from './types'

// 마일리지 타입 한도 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useTypeLimits() {
  return useQuery({
    queryKey: mileageTypeLimitsKeys.config(),
    queryFn: () =>
      apiClient
        .get<TypeLimitsData>('/admin/mileage/type-limits')
        .then((r) => r.data),
  })
}

/** 타입 한도 저장 — 변경된 타입만 보낸다. 저장돼야 수강생 구매가 실제로 막힌다. */
export function useSaveTypeLimits() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (limits: { type: string; limit: number }[]) =>
      apiClient
        .put<TypeLimitsData>('/admin/mileage/type-limits', { limits })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mileageTypeLimitsKeys.config() })
    },
  })
}
