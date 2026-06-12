import type {
  MentorDashboardData,
  MentorNextReservation,
  MentorTeamAssignment,
  MentorTeamDetailData,
  MentorTeamMember,
  MentorTeamStatus,
  MentorTeamsData,
  MentorTodoItem,
  MentoringLogStatus,
} from './types'

// 멘토 콘솔 mock 인메모리 상태 — 멘토 PR 시리즈(M1 홈·팀 / M2 예약 / M3·M4 일지 / M5 평가·추천)가
// 공유하는 단일 소유 모듈. 이후 PR의 mutation 핸들러는 이 db를 직접 변경(상태형 mock)하고
// 화면은 invalidateQueries 로 재조회한다. msw 자동 수집 글롭(features/**/mocks.ts)에 걸리지
// 않도록 mocks.ts(핸들러 전용)와 분리했다.
// 데이터: Figma 대표 시안(대시보드 2553:3399 · 내 배정 팀 2553:3554 · 팀 상세 2553:3696) 재현.

export interface MentorMockLog {
  logId: string
  /** 정렬·라벨 파생용 — '2026-05-26T14:00' */
  performedAt: string
  locationLabel: string // '온라인 · Zoom'
  actualMinutes: number
  /** 수정 요청(재제출 전) 등 인정 미확정이면 null */
  recognizedHours: number | null
  status: MentoringLogStatus
  statusNote?: string
  summary: string
}

export interface MentorMockReservation {
  reservationId: string
  /** '2026-05-28T14:00' */
  startsAt: string
  dayOfWeekLabel: string
  locationTypeLabel: string
  locationDetailLabel: string
  expectedMinutes: number
  requesterName: string
  /** 가장 임박한 확정 건에만 — 'D-1' */
  dDayLabel: string | null
}

export interface MentorMockTeam {
  teamId: string
  assignmentId: string
  cohortLabel: string
  teamName: string
  periodLabel: string
  status: MentorTeamStatus
  allocatedHours: number
  accumulatedHours: number
  recognizedHours: number
  members: MentorTeamMember[]
  reservationSummary: {
    inProgress: number
    confirmed: number
    completed: number
  }
  /** 다음 확정(CONFIRMED) 예약 — 없으면 null */
  nextConfirmed: MentorMockReservation | null
  logs: MentorMockLog[]
}

interface MentorMockDb {
  mentorName: string
  teams: MentorMockTeam[]
  /** '해야 할 일' — 집계 규칙 BE 확정 대기라 Figma 대표값 고정(hero 5건 = countLabel 합) */
  todos: MentorTodoItem[]
}

export const mentorDb: MentorMockDb = {
  mentorName: '임수현',
  todos: [
    { type: 'log_write', countLabel: '2건', required: true },
    { type: 'evaluation', countLabel: '1팀', required: true },
    { type: 'recommendation', countLabel: '1팀', required: false },
    { type: 'change_response', countLabel: '1건', required: true },
  ],
  teams: [
    {
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      cohortLabel: 'AI 5기',
      teamName: '추천시스템 팀',
      periodLabel: '2026-04-01 ~ 2026-07-15',
      status: 'in_progress',
      allocatedHours: 12,
      accumulatedHours: 8,
      recognizedHours: 8,
      members: [
        { studentId: 'stu_kim', name: '김수강', role: 'pm' },
        { studentId: 'stu_park', name: '박지호', role: 'member' },
        { studentId: 'stu_choi', name: '최유나', role: 'member' },
        { studentId: 'stu_han', name: '한지우', role: 'member' },
        { studentId: 'stu_song', name: '송하늘', role: 'member' },
      ],
      reservationSummary: { inProgress: 1, confirmed: 1, completed: 3 },
      nextConfirmed: {
        reservationId: 'res_rec_5',
        startsAt: '2026-05-28T14:00',
        dayOfWeekLabel: '수',
        locationTypeLabel: '온라인',
        locationDetailLabel: 'Zoom',
        expectedMinutes: 90,
        requesterName: '김수강',
        dDayLabel: 'D-1',
      },
      logs: [
        {
          logId: 'log_rec_4',
          performedAt: '2026-05-26T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 90,
          recognizedHours: 1.5,
          status: 'valid',
          summary: '추천 모델 v2 평가 지표 검토 + 다음 액션 정리',
        },
        {
          logId: 'log_rec_3',
          performedAt: '2026-05-20T19:00',
          locationLabel: '오프라인 · 강의장 B',
          actualMinutes: 120,
          recognizedHours: 2,
          status: 'valid',
          summary: '콜드 스타트 케이스 디버깅 라이브 + 팀원 1:1 점검',
        },
        {
          logId: 'log_rec_2',
          performedAt: '2026-05-14T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 90,
          recognizedHours: 1.5,
          status: 'valid',
          summary: '임베딩 모델 비교 실험 결과 리뷰',
        },
        {
          logId: 'log_rec_1',
          performedAt: '2026-05-08T19:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 180,
          recognizedHours: 3,
          status: 'valid',
          summary: '초기 PRD 검토 + 데이터 파이프라인 설계 자문',
        },
      ],
    },
    {
      teamId: 'team_dm',
      assignmentId: 'asgn_dm',
      cohortLabel: 'DA 4기',
      teamName: '데이터마트 팀',
      periodLabel: '2026-03-23 ~ 2026-07-10',
      status: 'evaluation_needed',
      allocatedHours: 10,
      accumulatedHours: 10,
      recognizedHours: 10,
      // 팀 상세 시안은 추천시스템 팀만 — 나머지 팀원 구성은 mock 보강 데이터.
      members: [
        { studentId: 'stu_seo', name: '서지민', role: 'pm' },
        { studentId: 'stu_lee_d', name: '이도현', role: 'member' },
        { studentId: 'stu_kim_n', name: '김나윤', role: 'member' },
        { studentId: 'stu_jung', name: '정태호', role: 'member' },
      ],
      reservationSummary: { inProgress: 0, confirmed: 1, completed: 4 },
      nextConfirmed: {
        reservationId: 'res_dm_5',
        startsAt: '2026-05-29T19:00',
        dayOfWeekLabel: '목',
        locationTypeLabel: '오프라인',
        locationDetailLabel: '강의장 B',
        expectedMinutes: 120,
        requesterName: '서지민',
        dDayLabel: null,
      },
      logs: [
        {
          logId: 'log_dm_4',
          performedAt: '2026-05-24T19:00',
          locationLabel: '오프라인 · 강의장 B',
          actualMinutes: 120,
          recognizedHours: 2,
          status: 'valid',
          summary: '집계 마트 성능 점검 + 지표 정의 검토',
        },
        {
          logId: 'log_dm_3',
          performedAt: '2026-05-16T19:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 150,
          recognizedHours: 2.5,
          status: 'valid',
          summary: '대시보드 지표 검증 세션',
        },
        {
          logId: 'log_dm_2',
          performedAt: '2026-05-09T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 120,
          recognizedHours: 2,
          status: 'valid',
          summary: 'ETL 파이프라인 리뷰',
        },
        {
          logId: 'log_dm_1',
          performedAt: '2026-04-30T19:00',
          locationLabel: '오프라인 · 강의장 B',
          actualMinutes: 210,
          recognizedHours: 3.5,
          status: 'valid',
          summary: '데이터 모델링 기초 자문',
        },
      ],
    },
    {
      teamId: 'team_ts',
      assignmentId: 'asgn_ts',
      cohortLabel: 'AI 5기',
      teamName: '트러블슈팅 팀',
      periodLabel: '2026-04-06 ~ 2026-07-15',
      status: 'change_requested',
      allocatedHours: 8,
      // 수정 요청 일지(5/22 60분)는 재제출 전 누적·인정 미반영(기존 유효본 기준, Figma 3.5h).
      accumulatedHours: 3.5,
      recognizedHours: 3.5,
      members: [
        { studentId: 'stu_park_j', name: '박준영', role: 'pm' },
        { studentId: 'stu_kim_h', name: '김하린', role: 'member' },
        { studentId: 'stu_lee_s', name: '이서준', role: 'member' },
        { studentId: 'stu_choi_m', name: '최민재', role: 'member' },
        { studentId: 'stu_yoon', name: '윤지아', role: 'member' },
        { studentId: 'stu_kang', name: '강도윤', role: 'member' },
      ],
      reservationSummary: { inProgress: 0, confirmed: 0, completed: 3 },
      nextConfirmed: null,
      logs: [
        {
          logId: 'log_ts_3',
          performedAt: '2026-05-22T19:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 60,
          recognizedHours: null,
          status: 'change_requested',
          statusNote: '일지 보강 필요',
          summary: '장애 재현 시나리오 점검',
        },
        {
          logId: 'log_ts_2',
          performedAt: '2026-05-15T19:00',
          locationLabel: '오프라인 · 강의장 B',
          actualMinutes: 120,
          recognizedHours: 2,
          status: 'valid',
          summary: '장애 로그 분석 실습',
        },
        {
          logId: 'log_ts_1',
          performedAt: '2026-05-07T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 90,
          recognizedHours: 1.5,
          status: 'valid',
          summary: '트러블슈팅 리포트 양식 점검',
        },
      ],
    },
    {
      teamId: 'team_nlp',
      assignmentId: 'asgn_nlp',
      cohortLabel: 'DA 4기',
      teamName: 'NLP 분석 팀',
      periodLabel: '2026-03-02 ~ 2026-05-15',
      status: 'completed',
      allocatedHours: 10,
      accumulatedHours: 11.5,
      recognizedHours: 10,
      members: [
        { studentId: 'stu_han_y', name: '한예린', role: 'pm' },
        { studentId: 'stu_kim_d', name: '김도윤', role: 'member' },
        { studentId: 'stu_park_s', name: '박시우', role: 'member' },
        { studentId: 'stu_lee_g', name: '이가은', role: 'member' },
        { studentId: 'stu_jo', name: '조윤서', role: 'member' },
      ],
      reservationSummary: { inProgress: 0, confirmed: 0, completed: 4 },
      nextConfirmed: null,
      logs: [
        {
          logId: 'log_nlp_4',
          performedAt: '2026-05-10T19:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 180,
          // 잔여 1.5h까지만 인정 — 초과 1.5h는 기록 보존(초과 멘토링 · 활동 인정 시간 없음).
          recognizedHours: 1.5,
          status: 'valid',
          summary: '최종 발표 리허설 피드백',
        },
        {
          logId: 'log_nlp_3',
          performedAt: '2026-05-02T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 180,
          recognizedHours: 3,
          status: 'valid',
          summary: '토픽 모델링 결과 해석 자문',
        },
        {
          logId: 'log_nlp_2',
          performedAt: '2026-04-25T19:00',
          locationLabel: '오프라인 · 강의장 B',
          actualMinutes: 150,
          recognizedHours: 2.5,
          status: 'valid',
          summary: '형태소 분석 파이프라인 리뷰',
        },
        {
          logId: 'log_nlp_1',
          performedAt: '2026-04-18T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 180,
          recognizedHours: 3,
          status: 'valid',
          summary: '분석 주제 정의 + 코퍼스 수집 전략',
        },
      ],
    },
  ],
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** '2026-05-26T14:00' → '5/26' (Figma 표기: 월 무패딩·일 2자리 유지) */
const dateLabelOf = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${Number(m)}/${d}`
}
const timeLabelOf = (iso: string) => iso.slice(11, 16)
const yearLabelOf = (iso: string) => iso.slice(0, 4)

const isActive = (team: MentorMockTeam) =>
  team.status !== 'completed' && team.status !== 'early_ended'

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
    nHoursDone: team.recognizedHours >= team.allocatedHours,
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
      // 제출 상태 연동은 평가·추천 PR(M5)에서 — Figma 시안 라벨은 '대기'만 정의.
      evaluationStatusLabel: team.status === 'completed' ? '완료' : '대기',
      recommendationStatusLabel: team.status === 'completed' ? '완료' : '대기',
    },
    recentLogs: team.logs.map((log) => ({
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
