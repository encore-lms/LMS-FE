import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mentorKeys } from '../queryKeys'
import type {
  MentoringRequestActionPayload,
  MentoringRequestItem,
  MentoringRequestsData,
} from '../types'

// 멘토링 예약 — P0_33 API명세 /api/mentor/v1/mentoring-requests* (apiClient baseURL /api).
// requestId(라우트 표기) = API reservationId. 응답(확정/거절/조정 제안)은 예약 목록뿐 아니라
// 대시보드 예정 멘토링·팀 요약에도 반영되므로 성공 시 멘토 캐시 전체를 무효화한다.

export function useMentoringRequests() {
  return useQuery({
    queryKey: mentorKeys.requests(),
    queryFn: () =>
      apiClient
        .get<MentoringRequestsData>('/mentor/v1/mentoring-requests')
        .then((r) => r.data),
  })
}

export function useMentoringRequestDetail(requestId: string) {
  return useQuery({
    queryKey: mentorKeys.requestDetail(requestId),
    enabled: !!requestId,
    queryFn: () =>
      apiClient
        .get<MentoringRequestItem>(`/mentor/v1/mentoring-requests/${requestId}`)
        .then((r) => r.data),
  })
}

/** 멘토 응답 액션 — 명세 세그먼트 그대로(confirm/reject/counter-propose/cancel). */
export type MentoringRequestAction =
  | 'confirm'
  | 'reject'
  | 'counter-propose'
  | 'cancel'

export interface MentoringRequestActionVariables {
  requestId: string
  action: MentoringRequestAction
  /**
   * 확정·조정 공용 필드(거절·취소는 mentorResponseNote만 — ReservationActionRequest).
   * 일정은 디자인상 자유 텍스트 라벨 전송 — BE 확정 시 confirmedStartsAt(ISO) 정규화 TODO.
   */
  payload?: MentoringRequestActionPayload
}

/**
 * 예약 응답 mutation — POST /mentor/v1/mentoring-requests/{id}/{action}.
 * 확정은 희망 일정 그대로(서버가 요청 슬롯으로 확정), 조정 제안은 일정·예상 시간·장소 필수
 * (422 MENTOR_RESERVATION_REQUIRED_FIELD_MISSING — FE는 폼 검증으로 선차단).
 */
export function useMentoringRequestAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      action,
      payload,
    }: MentoringRequestActionVariables) =>
      apiClient
        .post<MentoringRequestItem>(
          `/mentor/v1/mentoring-requests/${requestId}/${action}`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      // 목록·상세·대시보드(예정 멘토링)·팀 요약이 함께 변하므로 멘토 캐시 전체 무효화.
      queryClient.invalidateQueries({ queryKey: mentorKeys.all })
    },
  })
}

/** 확정 예약 일정·장소 변경 — PATCH /mentor/v1/mentoring-requests/{id}/confirmed-details. */
export function useUpdateConfirmedDetails() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string
      payload: MentoringRequestActionPayload
    }) =>
      apiClient
        .patch<MentoringRequestItem>(
          `/mentor/v1/mentoring-requests/${requestId}/confirmed-details`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentorKeys.all })
    },
  })
}
