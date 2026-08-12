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

export interface SubmitLogVariables {
  /** 재제출일 때만 필요(수정 요청 일지 id). 제출(신규)은 생성이므로 불필요. */
  logId?: string
  /** submit = 신규 생성(POST .../mentoring-logs), resubmit = 재제출(POST .../{id}/resubmit) */
  mode: 'submit' | 'resubmit'
  /** 제출 폼 값 전체 */
  payload?: MentoringLogDraftPayload
}

/**
 * 제출(생성)·재제출 — 승인 단계 도입.
 * - submit: POST /mentor/v1/mentoring-logs (신규 생성, status=submitted 승인 대기)
 * - resubmit: POST /mentor/v1/mentoring-logs/{logId}/resubmit (change_requested → submitted)
 * 인정 시간은 매니저 승인 시 산입된다.
 */
export function useSubmitMentoringLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, mode, payload }: SubmitLogVariables) =>
      apiClient
        .post<MentoringLogDetailData>(
          mode === 'resubmit'
            ? `/mentor/v1/mentoring-logs/${logId}/resubmit`
            : '/mentor/v1/mentoring-logs',
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentorKeys.all })
    },
  })
}

/** 업로드된 이미지 — 답변 값에 imageId 를 적어 제출하면 일지에 연결된다. */
export interface UploadedLogImage {
  imageId: string
  fileName: string
  contentType: string
  sizeBytes: number
}

/**
 * 이미지 항목 첨부 업로드 — 일지 제출 *전*에 올려 id 를 받는다.
 *
 * <p>제출 시점엔 아직 일지가 없어 서버가 파일을 먼저 저장하고, 답변 값에 적힌 id 로 잇는다.</p>
 */
export function useUploadLogImage() {
  return useMutation<UploadedLogImage, Error, File>({
    mutationFn: (file) => {
      const form = new FormData()
      form.append('file', file)
      return apiClient
        .postForm<UploadedLogImage>('/mentor/v1/mentoring-log-images', form)
        .then((r) => r.data)
    },
  })
}

// 첨부 이미지는 인증이 필요해 <img src> 로 직접 못 부른다 — LogImage 가 토큰 실린 요청으로
// blob 을 받아 그린다(2026-08-06).

/**
 * 첨부 이미지 삭제 — 작성 중 뺀 이미지를 서버에서도 지운다.
 *
 * <p>업로드는 제출 전에 끝나므로, 지우지 않으면 일지에 붙지 않은 파일이 그대로 쌓인다.
 * 이미 제출한 일지의 첨부는 서버가 422 로 막는다(재제출·일지 삭제가 정리).</p>
 */
export function useDeleteLogImage() {
  return useMutation<void, Error, string>({
    mutationFn: (imageId) =>
      apiClient
        .delete<void>(`/mentor/v1/mentoring-log-images/${imageId}`)
        .then(() => undefined),
  })
}
