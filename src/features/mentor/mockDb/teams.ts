// 멘토 mock — 대시보드·내 배정 팀·팀 상세 read model 빌더(M1).
import type {
  MentorDashboardData,
  MentorNextReservation,
  MentorTeamDetailData,
  MentorTeamsData,
} from '../types'
import { mentorDb } from './db'
import type { MentorMockTeam } from './db'
import {
  dateLabelOf,
  sortByPerformedAtDesc,
  timeLabelOf,
  toAssignment,
  yearLabelOf,
} from './shared'

const isActive = (team: MentorMockTeam) =>
  team.status !== 'completed' && team.status !== 'early_ended'

const nextReservationOf = (
  team: MentorMockTeam,
): MentorNextReservation | null =>
  team.nextConfirmed && {
    reservationId: team.nextConfirmed.reservationId,
    dateLabel: dateLabelOf(team.nextConfirmed.startsAt),
    dayOfWeekLabel: team.nextConfirmed.dayOfWeekLabel,
    timeLabel: timeLabelOf(team.nextConfirmed.startsAt),
    locationTypeLabel: team.nextConfirmed.locationTypeLabel,
    locationDetailLabel: team.nextConfirmed.locationDetailLabel,
    expectedMinutes: team.nextConfirmed.expectedMinutes,
    requesterName: team.nextConfirmed.requesterName,
    dDayLabel: team.nextConfirmed.dDayLabel,
  }

/** GET /mentor/v1/dashboard 응답 빌더. */
export function buildDashboardData(): MentorDashboardData {
  // 대시보드 노출 기준: 완료·조기 종료 팀 제외(Figma '3팀') — 노출 규칙은 BE 확정 대기 TODO.
  const active = mentorDb.teams.filter(isActive).map(toAssignment)
  const todoCount = mentorDb.todos.reduce(
    (sum, t) => sum + (parseInt(t.countLabel, 10) || 0),
    0,
  )

  const sessions = mentorDb.teams
    .filter((t) => t.nextConfirmed)
    .sort((a, b) =>
      a.nextConfirmed!.startsAt.localeCompare(b.nextConfirmed!.startsAt),
    )
    .map((t) => ({
      reservationId: t.nextConfirmed!.reservationId,
      teamId: t.teamId,
      cohortLabel: t.cohortLabel,
      teamName: t.teamName,
      dateLabel: dateLabelOf(t.nextConfirmed!.startsAt),
      dayOfWeekLabel: t.nextConfirmed!.dayOfWeekLabel,
      timeLabel: timeLabelOf(t.nextConfirmed!.startsAt),
      locationTypeLabel: t.nextConfirmed!.locationTypeLabel,
      locationDetailLabel: t.nextConfirmed!.locationDetailLabel,
      expectedMinutes: t.nextConfirmed!.expectedMinutes,
      dDayLabel: t.nextConfirmed!.dDayLabel,
      requesterName: t.nextConfirmed!.requesterName,
    }))

  const recentLogs = mentorDb.teams
    .flatMap((team) => team.logs.map((log) => ({ team, log })))
    .sort((a, b) => b.log.performedAt.localeCompare(a.log.performedAt))
    .slice(0, 3) // '최근 7일' 대표 3건(Figma)
    .map(({ team, log }) => ({
      logId: log.logId,
      teamId: team.teamId,
      cohortLabel: team.cohortLabel,
      teamName: team.teamName,
      dateLabel: dateLabelOf(log.performedAt),
      yearLabel: yearLabelOf(log.performedAt),
      actualMinutes: log.actualMinutes,
      recognizedHours: log.recognizedHours,
      status: log.status,
      statusNote: log.statusNote,
    }))

  return {
    mentor: {
      name: mentorDb.mentorName,
      assignedTeamCount: active.length,
      todoCount,
    },
    teamCards: active,
    todos: mentorDb.todos,
    upcoming: { confirmedCount: sessions.length, sessions },
    teamTable: active,
    recentLogs,
  }
}

/** GET /mentor/v1/teams 응답 빌더. */
export function buildTeamsData(): MentorTeamsData {
  const teams = mentorDb.teams.map(toAssignment)
  return {
    kpis: {
      // '진행 중' = N시간 미완료 일반 진행(평가 필요·완료·조기 종료 제외) — Figma 2팀 기준 산정.
      inProgress: teams.filter(
        (t) =>
          !t.nHoursDone &&
          t.status !== 'evaluation_needed' &&
          t.status !== 'completed' &&
          t.status !== 'early_ended',
      ).length,
      // '예약 대기' = 멘토 확인이 필요한 진행 중 예약 요청 건수(요청 확인 필요) — Figma 1팀 기준.
      reservationWaiting: mentorDb.teams.reduce(
        (sum, t) => sum + t.reservationSummary.inProgress,
        0,
      ),
      evaluationNeeded: teams.filter((t) => t.status === 'evaluation_needed')
        .length,
      changeRequested: teams.filter((t) => t.status === 'change_requested')
        .length,
    },
    totalTeamCount: teams.length,
    teams,
  }
}

/** GET /mentor/v1/teams/{teamId} 응답 빌더 — 미배정 팀이면 null(403 처리). */
export function buildTeamDetailData(
  teamId: string,
): MentorTeamDetailData | null {
  const team = mentorDb.teams.find((t) => t.teamId === teamId)
  if (!team) return null
  const assignment = toAssignment(team)
  // 평가·추천 게이트: N시간 완료 또는 조기 종료 시에만 활성(422 MENTOR_EVALUATION_NOT_ELIGIBLE).
  const locked = !(assignment.nHoursDone || team.status === 'early_ended')
  return {
    assignment,
    periodLabel: team.periodLabel,
    mentorName: mentorDb.mentorName,
    members: team.members,
    reservationSummary: team.reservationSummary,
    nextReservation: nextReservationOf(team),
    evaluation: {
      locked,
      lockReasonLabel: 'N시간 완료 후 활성',
      progressHours: assignment.recognizedHours,
      allocatedHours: assignment.allocatedHours,
      percent:
        assignment.allocatedHours > 0
          ? Math.round(
              (assignment.recognizedHours / assignment.allocatedHours) * 100,
            )
          : 0,
      // M4 제출 상태 연동 — 제출 즉시 '완료'(제출 후 수정 불가, PATCH/DELETE 없음).
      evaluationStatusLabel: mentorDb.evaluations.some(
        (e) => e.teamId === teamId,
      )
        ? '완료'
        : '대기',
      recommendationStatusLabel: mentorDb.recommendations.some(
        (r) => r.teamId === teamId,
      )
        ? '완료'
        : '대기',
    },
    // 최신순 정렬 — M3에서 초안(작성 중) 일지가 추가돼 배열 순서 대신 진행 일시 기준 파생.
    recentLogs: sortByPerformedAtDesc(team.logs).map((log) => ({
      logId: log.logId,
      datetimeLabel: `${dateLabelOf(log.performedAt)} ${timeLabelOf(log.performedAt)}`,
      locationLabel: log.locationLabel,
      actualMinutes: log.actualMinutes,
      recognizedHours: log.recognizedHours,
      summary: log.summary,
      status: log.status,
      statusNote: log.statusNote,
    })),
  }
}
