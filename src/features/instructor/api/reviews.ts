import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorRecordReviewData,
  ProjectReviewData,
  ProjectReviewDetail,
  TsReviewData,
  TsReviewDetail,
} from '@/shared/types'

// 강사 검토 3종 (§13~§15) 데이터. baseURL이 /api라 경로 앞에 안 붙임.
// §13은 조회 전용 그리드 — 과정(courseId)·기수(cohortId)별 조회.
// 운영 임베드(source='admin')도 같은 /instructor 경로를 쓴다 — BE가 운영자+명시 기수를
// 탭으로 좁히지 않고 그대로 조회하며 courses:[]를 채워 준다(구 /admin/records/review-grid 수렴).
export function useRecordReviews(
  courseId: string,
  cohortId: string,
  source: 'instructor' | 'admin' = 'instructor',
) {
  return useQuery({
    queryKey: [...instructorKeys.recordReviews(courseId, cohortId), source],
    queryFn: () =>
      apiClient
        .get<InstructorRecordReviewData>(
          `/instructor/records/review?courseId=${encodeURIComponent(courseId)}&cohortId=${encodeURIComponent(cohortId)}`,
        )
        .then((r) => r.data),
    // 운영 임베드는 기수 prop이 채워진 뒤에만 — 'none'으로 부르면 빈 그리드가 캐시된다.
    enabled: source === 'instructor' || cohortId !== 'none',
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

// §14·§15 검토 상세 — 상세 패널용. id가 null이면 조회하지 않음(패널 닫힘 상태).
export function useProjectReviewDetail(projectId: string | null) {
  return useQuery({
    queryKey: instructorKeys.projectReviewDetail(projectId ?? ''),
    queryFn: () =>
      apiClient
        .get<ProjectReviewDetail>(`/instructor/projects/review/${projectId}`)
        .then((r) => r.data),
    enabled: projectId !== null,
  })
}

export function useTsReviewDetail(caseId: string | null) {
  return useQuery({
    queryKey: instructorKeys.tsReviewDetail(caseId ?? ''),
    queryFn: () =>
      apiClient
        .get<TsReviewDetail>(`/instructor/troubleshooting/review/${caseId}`)
        .then((r) => r.data),
    enabled: caseId !== null,
  })
}

// ── 인증/보완 요청 (mutations) — 실 BE(InstructorReviewActionController) 연동. ──
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

/**
 * 프로젝트 인증 취소 — 인증된 것만. 사유 필수(되돌릴 수 없는 조작이라 이유가 남아야 한다).
 * 인증 이력(누가·언제)이 지워지고 상태는 다시 검토 대기로 돌아간다.
 */
export function useRevokeProjectCertification() {
  const qc = useQueryClient()
  return useMutation<void, Error, RequestChangesInput>({
    mutationFn: ({ id, reason }) =>
      apiClient
        .patch<void>(`/instructor/projects/review/${id}`, {
          action: 'revoke',
          reason,
        })
        .then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.projectReviews() })
    },
  })
}

/** 트러블슈팅 인증 취소 — 인증된 것만. 사유 필수. */
export function useRevokeTsCertification() {
  const qc = useQueryClient()
  return useMutation<void, Error, RequestChangesInput>({
    mutationFn: ({ id, reason }) =>
      apiClient
        .patch<void>(`/instructor/troubleshooting/review/${id}`, {
          action: 'revoke',
          reason,
        })
        .then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.tsReviews() })
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
