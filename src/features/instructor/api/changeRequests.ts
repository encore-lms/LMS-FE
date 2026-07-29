import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  ChangeRequestAction,
  InstructorChangeRequestRow,
  InstructorChangeRequestsData,
  RecertificationAction,
  RecertificationRow,
  RecertificationsData,
} from '@/shared/types'

// 인증 후 통합 검토 (/instructor/change-requests · /instructor/recertifications) 데이터.
export function useChangeRequests() {
  return useQuery({
    queryKey: instructorKeys.changeRequests(),
    queryFn: () =>
      apiClient
        .get<InstructorChangeRequestsData>('/instructor/change-requests')
        .then((r) => r.data),
  })
}

export function useRecertifications() {
  return useQuery({
    queryKey: instructorKeys.recertifications(),
    queryFn: () =>
      apiClient
        .get<RecertificationsData>('/instructor/recertifications')
        .then((r) => r.data),
  })
}

// ── 검토 처리 (mutations) — mock 백엔드. 실 BE 계약 확정 시 페어가 shared PR로 교체. ──
// 도메인 규칙: 승인은 사유 없음, 반려/보완요청은 사유(reason) 필수.

export interface ResolveChangeRequestInput {
  id: string
  action: ChangeRequestAction
  /** 반려(rejected) 시 필수 — 승인 시 미사용 */
  reason?: string
}

// 변경 제안 승인/반려 — 큐에서 종결된다.
export function useResolveChangeRequest() {
  const qc = useQueryClient()
  return useMutation<
    InstructorChangeRequestRow,
    Error,
    ResolveChangeRequestInput
  >({
    mutationFn: ({ id, action, reason }) =>
      apiClient
        .patch<InstructorChangeRequestRow>(
          `/instructor/change-requests/${id}`,
          { action, reason },
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.changeRequests() })
    },
  })
}

export interface ResolveRecertificationInput {
  id: string
  action: RecertificationAction
  /** 보완요청(changes_requested) 시 필수 — 재인증 승인 시 미사용 */
  reason?: string
}

// 재인증 승인/보완요청 — 큐에서 종결된다.
export function useResolveRecertification() {
  const qc = useQueryClient()
  return useMutation<RecertificationRow, Error, ResolveRecertificationInput>({
    mutationFn: ({ id, action, reason }) =>
      apiClient
        .patch<RecertificationRow>(`/instructor/recertifications/${id}`, {
          action,
          reason,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.recertifications() })
    },
  })
}
