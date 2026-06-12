import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { resumeKeys } from '../resume/queryKeys'
import type {
  ResumeCreatePayload,
  ResumeDetail,
  ResumeListResponse,
  ResumeSummary,
  ResumeUpdatePayload,
} from '../resume/types'

// 수강생 이력서 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).

/** 이력서 목록 + KPI 조회 */
export function useResumes() {
  return useQuery({
    queryKey: resumeKeys.list(),
    queryFn: () =>
      apiClient.get<ResumeListResponse>('/student/resume').then((r) => r.data),
  })
}

/** 이력서 단건 조회 — 편집기 로드(resumeId 없으면 비활성, 새 작성 모드) */
export function useResume(resumeId: string | undefined) {
  return useQuery({
    queryKey: resumeKeys.detail(resumeId ?? ''),
    enabled: Boolean(resumeId),
    queryFn: () =>
      apiClient
        .get<ResumeDetail>(`/student/resume/${resumeId}`)
        .then((r) => r.data),
  })
}

/** 새 이력서 생성 — 성공 시 목록 캐시 무효화 */
export function useCreateResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ResumeCreatePayload) =>
      apiClient
        .post<ResumeSummary>('/student/resume', payload)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.all })
    },
  })
}

/** 이력서 저장/제출 — id는 호출 시점에 전달(새로 만든 이력서에도 사용). 성공 시 캐시 무효화 */
export function useUpdateResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ResumeUpdatePayload
    }) =>
      apiClient
        .put<ResumeSummary>(`/student/resume/${id}`, payload)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.all })
    },
  })
}

/** 이력서 삭제 — 성공 시 목록 캐시 무효화 */
export function useDeleteResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (resumeId: string) =>
      apiClient.delete(`/student/resume/${resumeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.all })
    },
  })
}
