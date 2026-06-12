import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mentorKeys } from '../queryKeys'
import type {
  MentoringLogDetailData,
  MentoringLogDraftPayload,
  MentoringLogFieldSnapshot,
  MentoringLogTargetsData,
  MentoringLogsData,
} from '../types'

// 멘토링 일지 — P0_34 API명세 /api/mentor/v1/mentoring-logs* (apiClient baseURL /api).
// 제출·재제출은 인정 시간 재계산이 팀 누적(대시보드·팀 상세)·완료 예약 파생에도 반영되므로
// 성공 시 멘토 캐시 전체를 무효화한다(M2 선례).

export function useMentoringLogs() {
  return useQuery({
    queryKey: mentorKeys.logs(),
    queryFn: () =>
      apiClient
        .get<MentoringLogsData>('/mentor/v1/mentoring-logs')
        .then((r) => r.data),
  })
}

export function useMentoringLogDetail(logId: string) {
  return useQuery({
    queryKey: mentorKeys.logDetail(logId),
    enabled: !!logId,
    queryFn: () =>
      apiClient
        .get<MentoringLogDetailData>(`/mentor/v1/mentoring-logs/${logId}`)
        .then((r) => r.data),
  })
}

/** 작성 대상 팀 — GET /mentor/v1/mentoring-logs/targets (대상 팀 select·시간 산정 프리뷰). */
export function useMentoringLogTargets() {
  return useQuery({
    queryKey: mentorKeys.logTargets(),
    queryFn: () =>
      apiClient
        .get<MentoringLogTargetsData>('/mentor/v1/mentoring-logs/targets')
        .then((r) => r.data),
  })
}

/** 운영 적용 템플릿 항목 스냅샷 — GET /mentor/v1/teams/{teamId}/log-field-snapshot. */
export function useLogFieldSnapshot(teamId: string) {
  return useQuery({
    queryKey: mentorKeys.logFields(teamId),
    enabled: !!teamId,
    queryFn: () =>
      apiClient
        .get<
          MentoringLogFieldSnapshot[]
        >(`/mentor/v1/teams/${teamId}/log-field-snapshot`)
        .then((r) => r.data),
  })
}

export interface SaveLogDraftVariables {
  /** 기존 초안 갱신이면 logId — 없으면 신규 초안 생성 */
  logId?: string
  payload: MentoringLogDraftPayload
}

/**
 * 초안 저장 — PUT /mentor/v1/mentoring-logs/draft(신규) · /{logId}/draft(갱신).
 * 초안은 자유 수정·인정 시간 미반영(DRAFT) — 부분 입력 그대로 저장한다.
 */
export function useSaveLogDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, payload }: SaveLogDraftVariables) =>
      apiClient
        .put<MentoringLogDetailData>(
          logId
            ? `/mentor/v1/mentoring-logs/${logId}/draft`
            : '/mentor/v1/mentoring-logs/draft',
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentorKeys.all })
    },
  })
}

export interface SubmitLogVariables {
  logId: string
  /** 재제출 = 수정 요청 일지 전체 수정 후(즉시 자동 유효, 폐기·반려 없음) */
  mode: 'submit' | 'resubmit'
  /** 제출 직전 폼 값 반영(전체 수정) — mock 이 필수 항목 검증(422) */
  payload?: MentoringLogDraftPayload
}

/**
 * 제출·재제출 — POST /mentor/v1/mentoring-logs/{logId}/{submit|resubmit}.
 * 제출 즉시 자동 유효 — 인정 시간 재계산이 팀 누적·팀 상태·완료 예약 파생에 즉시 반영된다.
 */
export function useSubmitMentoringLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, mode, payload }: SubmitLogVariables) =>
      apiClient
        .post<MentoringLogDetailData>(
          `/mentor/v1/mentoring-logs/${logId}/${mode}`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentorKeys.all })
    },
  })
}
