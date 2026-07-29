import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { EditRequestState } from '../workspace/useProjectFlow'

// 프로젝트 인증 후 변경 제안(수정 권한) — learning-service 실 BE(ISSUE 3+4).
// 상태는 서버가 정본(GET), 생성/제출은 POST. 강사 승인/반려가 이 상태에 반영된다.

const statusKey = (projectId: string) =>
  ['student', 'project-change-request', projectId] as const

/** 본인 변경 제안 상태 로드 — 워크스페이스 editStatus 정본. 없으면 status=none. */
export function useProjectChangeStatus(projectId: string) {
  return useQuery({
    queryKey: statusKey(projectId),
    queryFn: () =>
      apiClient
        .get<EditRequestState>(`/student/projects/${projectId}/change-request`)
        .then((r) => r.data),
    enabled: projectId !== 'unknown',
  })
}

/** 수정 권한 요청 생성. 성공 시 상태 재조회. */
export function useRequestProjectChange(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestReason: string) =>
      apiClient
        .post(`/student/projects/${projectId}/change-requests`, {
          requestReason,
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusKey(projectId) }),
  })
}

/** 수정 완료 재제출(재인증 큐로). 성공 시 상태 재조회. */
export function useSubmitProjectRevision(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (changeSummary: string) =>
      apiClient
        .post(`/student/projects/${projectId}/change-requests/submit`, {
          changeSummary,
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusKey(projectId) }),
  })
}

/** 변경 제안 취소 — 강사 승인 전(requested)만. 성공 시 상태 재조회(none 복귀). */
export function useCancelProjectChange(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient
        .delete(`/student/projects/${projectId}/change-requests`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusKey(projectId) }),
  })
}
