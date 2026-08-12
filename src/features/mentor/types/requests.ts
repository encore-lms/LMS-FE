// 멘토 도메인 타입 — 멘토링 예약 요청·슬롯·멘토 응답 payload(M2).
import type { MentorTeamMemberRole } from './team'

/**
 * 예약 상태 — MentoringReservationStatus 6종(P0_32_35 API명세).
 * '진행 중'(팀당 1건 제약 대상) = requested · counter_proposed · confirmed.
 */
export type MentoringRequestStatus =
  | 'requested'
  | 'counter_proposed'
  | 'confirmed'
  | 'rejected'
  | 'canceled'
  | 'completed'

export const MENTORING_REQUEST_STATUS_LABEL: Record<
  MentoringRequestStatus,
  string
> = {
  requested: '요청 대기',
  counter_proposed: '조정 제안',
  confirmed: '확정',
  rejected: '거절',
  canceled: '취소',
  completed: '완료',
}

/** 장소 유형 — 오프라인/온라인/기타(03_멘토.md §4). */
export type MentoringPlaceType = 'offline' | 'online' | 'etc'

export const MENTORING_PLACE_TYPE_LABEL: Record<MentoringPlaceType, string> = {
  offline: '오프라인',
  online: '온라인',
  etc: '기타',
}

/**
 * 예약 일정 슬롯 — 수강생 희망·멘토 조정 제안·확정 일정 공용(수강생측 MentoringSlot 대응).
 * dateTimeLabel 은 디자인상 자유 텍스트('6/3(화) 19:00 ~ 21:00') — BE 확정 시
 * confirmedStartsAt(ISO) + confirmedDurationMinutes 로 정규화(날짜·시간 피커 도입) TODO.
 */
export interface MentoringRequestSlot {
  dateTimeLabel: string
  placeType: MentoringPlaceType
  placeDetail: string
  expectedMinutes: number
  memo?: string
  /** ISO 원본 — 라벨엔 연도가 없어, 일지로 값을 옮길 땐 이 값을 쓴다. */
  startsAt?: string | null
  endsAt?: string | null
}

/** GET /mentor/v1/mentoring-requests 행 — requestId = API reservationId. */
export interface MentoringRequestItem {
  requestId: string
  teamId: string
  cohortLabel: string
  teamName: string
  status: MentoringRequestStatus
  /** 처리 마감 D-day — 계산 규칙(기준일) BE 확정 대기, Figma 대표값 고정 */
  dDayLabel: string | null
  requestedAtLabel: string // '2026-05-26 19:42'
  requester: { name: string; role: MentorTeamMemberRole }
  /** 수강생 희망 일정(요청 원문 — 멘토 응답 후에도 보존) */
  desired: MentoringRequestSlot
  /** 내 조정 제안 — counter_proposed 상태에서만 존재 */
  proposal: MentoringRequestSlot | null
  /** 확정 일정 — confirmed·completed 상태에서만 존재 */
  confirmed: MentoringRequestSlot | null
  /** 거절·조정 응답 메모(수강생 공개 mentorResponseNote) — 필수/선택 정책 미확정(선택으로 구현) TODO */
  mentorResponseNote?: string
  /** 최근 활동 시각('YYYY-MM-DDTHH:mm') — 목록 정렬·기간 필터용 파생 */
  activityAt: string
}

/** GET /mentor/v1/mentoring-requests — 상태 탭·KPI 집계는 클라이언트 파생(목록 단일 응답). */
export interface MentoringRequestsData {
  requests: MentoringRequestItem[]
}

/**
 * 멘토 응답 payload — ReservationActionRequest 대응(확정·조정·확정 정보 변경 공용,
 * 거절·취소는 mentorResponseNote만). 일정은 라벨 문자열(BE 확정 시 ISO 정규화 TODO).
 */
export interface MentoringRequestActionPayload {
  dateTimeLabel?: string
  placeType?: MentoringPlaceType
  placeDetail?: string
  expectedMinutes?: number
  mentorResponseNote?: string
}
