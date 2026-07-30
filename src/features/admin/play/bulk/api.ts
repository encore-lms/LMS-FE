import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminPlayKeys } from '../queryKeys'
import type { PassageWriteBody } from '../api'

// CSV 일괄 등록 — FE가 파싱·1차 검증한 정상 행 묶음을 한 번에 저장한다.
// 서버가 전 행을 재검증하고 하나라도 틀리면 "N번째 행: 사유"로 전체 거부한다.
// 예전의 GET 미리보기 훅은 BE 미구현(404)·mock 전용이라 클라이언트 파싱(csv.ts)으로 대체됐다.
export function useBulkCreatePassages() {
  const queryClient = useQueryClient()
  return useMutation<{ created: number }, Error, PassageWriteBody[]>({
    mutationFn: (items) =>
      apiClient
        .post<{ created: number }>('/admin/play/typing-texts/bulk', { items })
        .then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminPlayKeys.overview() }),
  })
}
