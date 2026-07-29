// 수강생 멘토링 도메인 계약 — 기능 로컬. Figma 2651:5430.
// 팀 단위 요청 · 진행 중 3건 한도 · 조정 제안/확정/완료 기록.

export interface MentoringMentor {
  name: string
  specialty: string // "AI/ML 전문"
  assigned: boolean
}

/** 같은 팀에서 함께 멘토링 받는 수강생. isMe=본인. BE(MentoringResponse.Member). */
export interface MentoringTeamMemberInfo {
  name: string
  isMe: boolean
}

export interface MentoringKpis {
  inProgress: number
  requestLimit: number
  completed: number
  cumulativeHours: number // 누적 h
  remainingHours: number // 잔여 h
}

export type StatTone = 'neutral' | 'warning' | 'success' | 'info'
export interface MentoringStat {
  key: string
  label: string
  value: number
  caption: string
  tone: StatTone
}

/** 희망 일정(수강생) / 멘토 제안 공통 슬롯 */
export interface MentoringSlot {
  person: string // 요청자/응답자
  datetime: string // "2026-03-25(수) 19:00 ~ 21:00"
  placeType: string // 온라인/오프라인
  placeDetail: string
  memo: string
}

/** 진행 중 요청 — status=proposed면 조정 제안 카드 표시 */
export interface MentoringActiveRequest {
  id: string // "req_4f7c"
  status: 'requested' | 'proposed'
  proposedAtLabel: string // "2026-03-19 21:40"
  student: MentoringSlot
  proposal?: MentoringSlot
}

/** 확정 예약 */
export interface MentoringReservation {
  id: string // "res_8b21"
  phase?: 'upcoming' | 'awaiting_completion'
  dateLabel: string // "2026-03-26(목)"
  timeLabel: string // "18:30 ~ 20:30"
  placeType: string
  placeDetail: string
  estHours: string // "2h"
  mentorName: string
  mentorSpecialty: string
}

/** 팀 단위 새 요청 가능 여부와 상태별 한도 점유 현황 */
export interface MentoringRequestPolicy {
  limit: number
  inUse: number
  canRequest: boolean
  requestedCount: number
  proposedCount: number
  reservedCount: number
  blockReason: 'limit_reached' | 'mentor_not_assigned' | string | null
}

/** 완료 기록 한 줄 */
export interface MentoringHistoryRow {
  round: number
  datetime: string
  place: string
  hours: string // "예상 2h / 실제 2h"
  requester: string
}

export interface MentoringData {
  teamName: string
  mentor: MentoringMentor
  kpis: MentoringKpis
  stats: MentoringStat[]
  // 단건 필드는 BE 순차 배포 중인 구버전 응답과의 호환용이다.
  activeRequest: MentoringActiveRequest | null
  reservation: MentoringReservation | null
  activeRequests?: MentoringActiveRequest[]
  reservations?: MentoringReservation[]
  requestPolicy?: MentoringRequestPolicy
  history: MentoringHistoryRow[]
  // 함께 멘토링 받는 팀원. BE 미배포 환경 대비 optional(없으면 빈 패널).
  teamMembers?: MentoringTeamMemberInfo[]
}
