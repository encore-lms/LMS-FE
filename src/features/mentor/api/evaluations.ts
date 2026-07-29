import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mentorKeys } from '../queryKeys'
import type {
  MentorEvaluationDraftPayload,
  MentorEvaluationSheetData,
  MentorEvaluationsData,
  MentorRecommendationDraftPayload,
  MentorRecommendationSheetData,
  MentorRecommendationsData,
} from '../types'

// 평가 · 추천 — P0_35 API명세 /api/mentor/v1/teams/{teamId}/{evaluation|recommendation}*
// (apiClient baseURL /api). 최종 제출은 팀 상태 전이(평가 필요→완료)·대시보드·팀 상세에
// 반영되므로 멘토 캐시 전체를 무효화한다(M2·M3 선례). 초안 저장은 해당 시트 키만 무효화.

export function useTeamEvaluation(teamId: string) {
  return useQuery({
    queryKey: mentorKeys.teamEvaluation(teamId),
    enabled: !!teamId,
    queryFn: () =>
      apiClient
        .get<MentorEvaluationSheetData>(`/mentor/v1/teams/${teamId}/evaluation`)
        .then((r) => r.data),
  })
}

export interface SaveEvaluationDraftVariables {
  teamId: string
  payload: MentorEvaluationDraftPayload
}

/** 평가 초안 저장 — PUT /mentor/v1/teams/{teamId}/evaluation/draft (자동·수동 저장 공용). */
export function useSaveEvaluationDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, payload }: SaveEvaluationDraftVariables) =>
      apiClient
        .put<MentorEvaluationSheetData>(
          `/mentor/v1/teams/${teamId}/evaluation/draft`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: (_sheet, { teamId }) => {
      queryClient.invalidateQueries({
        queryKey: mentorKeys.teamEvaluation(teamId),
      })
    },
  })
}

/**
 * 평가 최종 제출 — POST /mentor/v1/teams/{teamId}/evaluation/submit.
 * 제출 후 수정 불가(PATCH/DELETE 없음) — 확인 모달 통과 후에만 호출한다.
 */
export function useSubmitEvaluation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, payload }: SaveEvaluationDraftVariables) =>
      apiClient
        .post<MentorEvaluationSheetData>(
          `/mentor/v1/teams/${teamId}/evaluation/submit`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentorKeys.all })
    },
  })
}

/** 제출 완료 페이지 요약 — GET /mentor/v1/evaluations (목록 read model, mock 보강). */
export function useEvaluationSubmissions() {
  return useQuery({
    queryKey: mentorKeys.evaluations(),
    queryFn: () =>
      apiClient
        .get<MentorEvaluationsData>('/mentor/v1/evaluations')
        .then((r) => r.data),
  })
}

export function useTeamRecommendation(teamId: string) {
  return useQuery({
    queryKey: mentorKeys.teamRecommendation(teamId),
    enabled: !!teamId,
    queryFn: () =>
      apiClient
        .get<MentorRecommendationSheetData>(
          `/mentor/v1/teams/${teamId}/recommendation`,
        )
        .then((r) => r.data),
  })
}

export interface SaveRecommendationDraftVariables {
  teamId: string
  payload: MentorRecommendationDraftPayload
}

/** 추천 초안 저장 — PUT /mentor/v1/teams/{teamId}/recommendation/draft. */
export function useSaveRecommendationDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, payload }: SaveRecommendationDraftVariables) =>
      apiClient
        .put<MentorRecommendationSheetData>(
          `/mentor/v1/teams/${teamId}/recommendation/draft`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: (_sheet, { teamId }) => {
      queryClient.invalidateQueries({
        queryKey: mentorKeys.teamRecommendation(teamId),
      })
    },
  })
}

/**
 * 추천 최종 제출 — POST /mentor/v1/teams/{teamId}/recommendation/submit.
 * 팀당 1건(assignmentId unique) · 제출 후 수정 불가 — 확인 모달 통과 후에만 호출한다.
 */
export function useSubmitRecommendation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, payload }: SaveRecommendationDraftVariables) =>
      apiClient
        .post<MentorRecommendationSheetData>(
          `/mentor/v1/teams/${teamId}/recommendation/submit`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentorKeys.all })
    },
  })
}

/** 제출 완료 페이지 요약 — GET /mentor/v1/recommendations (목록 read model, mock 보강). */
export function useRecommendationSubmissions() {
  return useQuery({
    queryKey: mentorKeys.recommendations(),
    queryFn: () =>
      apiClient
        .get<MentorRecommendationsData>('/mentor/v1/recommendations')
        .then((r) => r.data),
  })
}
