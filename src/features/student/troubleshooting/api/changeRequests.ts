import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'

// 트러블슈팅 변경 제안 — learning-service 실 BE(ISSUE 3+4). 항목별 diff + 사유 전송,
// 강사 승인 시 즉시 원본 반영(1왕복).

export interface TsChangeDiff {
  label: string
  before: string
  after: string
}

export interface CreateTsChangeInput {
  requestReason: string
  changes: TsChangeDiff[]
}

/** 제안 하나의 지금 상태. `none` 은 낸 적이 없다는 뜻. */
export type TsChangeStatus =
  | 'none'
  | 'requested'
  | 'approved'
  | 'revision_submitted'
  | 'rejected'

export interface TsChangeState {
  status: TsChangeStatus
  requestReason: string | null
  changeSummary: string | null
  /** 강사가 남긴 반려 사유. */
  decisionReason: string | null
  changes: TsChangeDiff[]
}

/**
 * 내가 낸 변경 제안의 지금 상태.
 *
 * <p>이걸 보지 않으면 낸 뒤에도 화면이 그대로라, 검토 중인지 반려됐는지 알 수 없고
 * 같은 제안을 계속 다시 내게 된다. 강사가 남긴 반려 사유도 여기에만 있다.</p>
 */
export function useTsChangeState(caseId: string, enabled = true) {
  return useQuery({
    queryKey: ['student', 'troubleshooting', caseId, 'change-request'],
    enabled: enabled && !!caseId,
    queryFn: () =>
      apiClient
        .get<TsChangeState>(`/student/troubleshooting/${caseId}/change-request`)
        .then((r) => r.data),
  })
}

export function useCreateTsChangeRequest(caseId: string) {
  return useMutation({
    mutationFn: (body: CreateTsChangeInput) =>
      apiClient
        .post(`/student/troubleshooting/${caseId}/change-requests`, body)
        .then((r) => r.data),
  })
}
