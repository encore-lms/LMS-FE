import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminIngestionKeys } from './queryKeys'
import type { IngestionOverview, SessionStatus } from './types'

// 인입 격리 큐 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useIngestionQueue() {
  return useQuery({
    queryKey: adminIngestionKeys.overview(),
    queryFn: () =>
      apiClient
        .get<IngestionOverview>('/admin/ingestion/quarantine')
        .then((r) => r.data),
  })
}

/** 인입 세션 처리 입력 — 재시도(실패 행 재인입) 또는 결정적 폐기 */
export interface IngestionActionInput {
  id: string
  action: 'retry' | 'discard'
  memo?: string
}

// 인입 세션 처리 훅 — 성공 시 세션/상세 상태를 전이하고 격리 행·진행 중 KPI를 재계산(목록 갱신).
// 재시도는 '진행 중'(실패 행 재인입 처리 중), 폐기는 '폐기됨'으로 전이한다.
// BE 계약(P0_20) 미확정 → 네트워크 없이 클라이언트 낙관 반영으로 시뮬레이션한다.
// 계약 확정 시 mutationFn 을 apiClient.post('/admin/ingestion/quarantine/:id/:action') 로 교체한다.
export function useIngestionAction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, IngestionActionInput>({
    mutationFn: async () => {},
    onSuccess: (_result, { id, action }) => {
      const next: SessionStatus =
        action === 'retry' ? 'in_progress' : 'discarded'
      queryClient.setQueryData<IngestionOverview>(
        adminIngestionKeys.overview(),
        (prev) => {
          if (!prev) return prev
          const sessions = prev.sessions.map((s) =>
            s.id === id ? { ...s, status: next } : s,
          )
          const detail = prev.details[id]
          const details = detail
            ? { ...prev.details, [id]: { ...detail, status: next } }
            : prev.details
          return {
            ...prev,
            sessions,
            details,
            summary: {
              ...prev.summary,
              // 격리 행 = 아직 '실패 있음' 세션의 실패 행 합 · 진행 중 = '진행 중' 세션 수
              quarantinedRows: sessions
                .filter((s) => s.status === 'has_failure')
                .reduce((sum, s) => sum + s.failedRows, 0),
              inProgress: sessions.filter((s) => s.status === 'in_progress')
                .length,
            },
          }
        },
      )
    },
  })
}
