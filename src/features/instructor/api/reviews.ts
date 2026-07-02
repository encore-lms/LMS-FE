import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorRecordReviewData,
  ProjectReviewData,
  TsReviewData,
} from '@/shared/types'

// 강사 검토 3종 (§13~§15) 데이터. baseURL이 /api라 경로 앞에 안 붙임.
// §13은 조회 전용 그리드 — 과정(courseId)·기수(cohortId)별 조회.
export function useRecordReviews(courseId: string, cohortId: string) {
  return useQuery({
    queryKey: instructorKeys.recordReviews(courseId, cohortId),
    queryFn: () =>
      apiClient
        .get<InstructorRecordReviewData>(
          `/instructor/records/review?courseId=${encodeURIComponent(courseId)}&cohortId=${encodeURIComponent(cohortId)}`,
        )
        .then((r) => r.data),
  })
}

export function useProjectReviews() {
  return useQuery({
    queryKey: instructorKeys.projectReviews(),
    queryFn: () =>
      apiClient
        .get<ProjectReviewData>('/instructor/projects/review')
        .then((r) => r.data),
  })
}

export function useTsReviews() {
  return useQuery({
    queryKey: instructorKeys.tsReviews(),
    queryFn: () =>
      apiClient
        .get<TsReviewData>('/instructor/troubleshooting/review')
        .then((r) => r.data),
  })
}

// ── 인증/보완 요청 (mutations) — mock 백엔드. 실 BE 계약 확정 시 페어가 shared PR로 교체. ──
// 액션 계약: certify(사유 없음) → 인증 완료 / requestChanges(사유 필수) → 보완 요청.

interface CertifyInput {
  id: string
}
interface RequestChangesInput {
  id: string
  reason: string
}

// §14 프로젝트 인증 — status requested → certified. ProjectCertification 생성.
export function useCertifyProject() {
  const qc = useQueryClient()
  return useMutation<void, Error, CertifyInput>({
    mutationFn: ({ id }) =>
      apiClient
        .patch<void>(`/instructor/projects/review/${id}`, { action: 'certify' })
        .then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.projectReviews() })
    },
  })
}

// §14 프로젝트 보완 요청 — status → changes_requested(보완 중). 사유 필수.
export function useRequestProjectChanges() {
  const qc = useQueryClient()
  return useMutation<void, Error, RequestChangesInput>({
    mutationFn: ({ id, reason }) =>
      apiClient
        .patch<void>(`/instructor/projects/review/${id}`, {
          action: 'requestChanges',
          reason,
        })
        .then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.projectReviews() })
    },
  })
}

// §15 트러블슈팅 인증 — status pending → certified. TroubleshootingCertification 생성.
export function useCertifyTroubleshooting() {
  const qc = useQueryClient()
  return useMutation<void, Error, CertifyInput>({
    mutationFn: ({ id }) =>
      apiClient
        .patch<void>(`/instructor/troubleshooting/review/${id}`, {
          action: 'certify',
        })
        .then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.tsReviews() })
    },
  })
}

// §15 트러블슈팅 보완 요청 — status → supplementing(보완 중). 사유 필수.
export function useRequestTsChanges() {
  const qc = useQueryClient()
  return useMutation<void, Error, RequestChangesInput>({
    mutationFn: ({ id, reason }) =>
      apiClient
        .patch<void>(`/instructor/troubleshooting/review/${id}`, {
          action: 'requestChanges',
          reason,
        })
        .then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.tsReviews() })
    },
  })
}
