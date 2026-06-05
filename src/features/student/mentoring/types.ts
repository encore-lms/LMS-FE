// 수강생 멘토링 도메인 계약 — 기능 로컬. Figma 2651:5430.
// 팀 단위 요청 · 진행 중 1건 한도 · 조정 제안/확정/완료 기록.

export interface MentoringMentor {
  name: string
  specialty: string // "AI/ML 전문"
  assigned: boolean
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
  dateLabel: string // "2026-03-26(목)"
  timeLabel: string // "18:30 ~ 20:30"
  placeType: string
  placeDetail: string
  estHours: string // "2h"
  mentorName: string
  mentorSpecialty: string
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
  activeRequest: MentoringActiveRequest | null
  reservation: MentoringReservation | null
  history: MentoringHistoryRow[]
}
