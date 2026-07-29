import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'

// 트러블슈팅 변경 제안 — learning-service 실 BE(ISSUE 3+4). 항목별 diff + 사유 전송,
// 강사 승인 시 즉시 원본 반영(1왕복). 상태는 강사 큐로만 흘러 별도 GET 미사용(로컬 미러 유지).

export interface TsChangeDiff {
  label: string
  before: string
  after: string
}

export interface CreateTsChangeInput {
  requestReason: string
  changes: TsChangeDiff[]
}

export function useCreateTsChangeRequest(caseId: string) {
  return useMutation({
    mutationFn: (body: CreateTsChangeInput) =>
      apiClient
        .post(`/student/troubleshooting/${caseId}/change-requests`, body)
        .then((r) => r.data),
  })
}
