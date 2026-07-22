// 멘토 mock — 도메인 파일들이 공유하는 파생 헬퍼(라벨·정렬·배정 read model·인정 수식).
import type { MentorTeamAssignment, MentoringPlaceType } from '../types'
import type { MentorMockLog, MentorMockTeam } from './db'

export const round1 = (n: number) => Math.round(n * 10) / 10

/** '2026-05-26T14:00' → '5/26' (Figma 표기: 월 무패딩·일 2자리 유지) */
export const dateLabelOf = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${Number(m)}/${d}`
}
export const timeLabelOf = (iso: string) => iso.slice(11, 16)
export const yearLabelOf = (iso: string) => iso.slice(0, 4)

export const sortByPerformedAtDesc = (logs: MentorMockLog[]) =>
  [...logs].sort((a, b) => b.performedAt.localeCompare(a.performedAt))

/** 팀 → 배정 read model. 잔여·초과·N시간 완료는 항상 파생(상태 변경 시 일관 유지). */
export function toAssignment(team: MentorMockTeam): MentorTeamAssignment {
  return {
    assignmentId: team.assignmentId,
    teamId: team.teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    memberCount: team.members.length,
    status: team.status,
    allocatedHours: team.allocatedHours,
    accumulatedHours: team.accumulatedHours,
    recognizedHours: team.recognizedHours,
    remainingHours: round1(
      Math.max(team.allocatedHours - team.recognizedHours, 0),
    ),
    excessHours: round1(
      Math.max(team.accumulatedHours - team.recognizedHours, 0),
    ),
    // 배정 시간이 0(미배정·미설정)이면 완료로 보지 않는다 — 0>=0 오판으로 평가 게이트가
    // 잘못 열리는 것을 막는다.
    nHoursDone:
      team.allocatedHours > 0 && team.recognizedHours >= team.allocatedHours,
  }
}

/**
 * 인정 시간 SSOT 수식(mentoring.md·DB설계 공통) — 일지 제출 PR(M3+)에서 사용 예정.
 * recognized = min(actual, max(remaining, 0)) / 초과분은 기록만 보존.
 */
export function recognizeMinutes(team: MentorMockTeam, actualMinutes: number) {
  const remainingMinutes = Math.max(
    team.allocatedHours * 60 - team.recognizedHours * 60,
    0,
  )
  const recognized = Math.min(actualMinutes, remainingMinutes)
  return {
    recognizedHours: round1(recognized / 60),
    excessHours: round1((actualMinutes - recognized) / 60),
  }
}

export const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** '2026-05-26T14:00' + 90분 → '15:30' (완료 일정 라벨 파생용) */
export function endTimeLabelOf(iso: string, minutes: number) {
  const [h, m] = iso.slice(11, 16).split(':').map(Number)
  const total = h * 60 + m + minutes
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
}

export const placeTypeOfLabel = (label: string): MentoringPlaceType =>
  label === '온라인' ? 'online' : label === '오프라인' ? 'offline' : 'etc'

/** 'YYYY-MM-DDTHH:mm' 현재 시각 — 응답 mutation 후 activityAt 갱신용 */
export function nowStamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const dowOf = (iso: string) => DOW_LABELS[new Date(iso).getDay()]

/** 제출 일지(초안 제외) — 회차·참석 이력·완료 예약 파생의 분모. */
export const submittedLogs = (team: MentorMockTeam) =>
  team.logs.filter((l) => l.status !== 'draft')

/**
 * 회차 — 동일 팀 제출 일지의 진행 일시 오름차순 누적 자동 산정.
 * 초안은 아직 미제출이라 '다음 회차'(제출 수 + 1)로 본다.
 */
export function roundOf(team: MentorMockTeam, log: MentorMockLog): number {
  const submitted = submittedLogs(team).sort((a, b) =>
    a.performedAt.localeCompare(b.performedAt),
  )
  if (log.status === 'draft') return submitted.length + 1
  return submitted.findIndex((l) => l.logId === log.logId) + 1
}
