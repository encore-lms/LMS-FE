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

// 일괄 지급/차감 실행 훅 — 성공 시 명단 캐시에 보유/사용/누적을 즉시 반영(상태 전이·목록 갱신).
// BE 계약(P0_16 MileageTransaction) 미확정 → 네트워크 없이 클라이언트 낙관 반영으로 시뮬레이션한다.
// 계약 확정 시 mutationFn 을 apiClient.post('/admin/mileage/direct-pay', input) 로 교체한다.
export function useDirectPaySubmit() {
  const queryClient = useQueryClient()
  return useMutation<DirectPayResult, Error, DirectPayInput>({
    mutationFn: async (input) => ({
      count: input.ids.length,
      total: input.ids.length * input.amount,
    }),
    onSuccess: (_result, input) => {
      const target = new Set(input.ids)
      queryClient.setQueryData<DirectPayData>(
        mileageDirectPayKeys.roster(),
        (prev) =>
          prev
            ? {
                ...prev,
                students: prev.students.map((s) =>
                  target.has(s.id)
                    ? input.kind === 'grant'
                      ? {
                          ...s,
                          held: s.held + input.amount,
                          accrued: s.accrued + input.amount,
                        }
                      : {
                          ...s,
                          held: Math.max(0, s.held - input.amount),
                          used: s.used + input.amount,
                        }
                    : s,
                ),
              }
            : prev,
      )
    },
  })
}
