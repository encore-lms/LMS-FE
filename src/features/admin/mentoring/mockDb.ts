import type {
  AdminLogTemplateOption,
  AdminMentorOption,
  AdminMentoringCohortOption,
  AdminMentoringLogDetail,
  AdminMentoringLogHistoryEntry,
  AdminMentoringLogRow,
  AdminMentoringLogSnapshotItem,
  AdminMentoringLogsData,
  MentorAssignmentCreateRequest,
  MentorAssignmentRow,
  MentorAssignmentsData,
  MentoringLogChangeRequestPayload,
} from './types'
import { MENTORING_LOG_CHANGE_REASON_LABEL } from './types'

// 운영 멘토링 mock 인메모리 상태 — A1(배정·일지) 단일 소유 모듈. mutation 핸들러가 이
// 상태를 실제로 변경하고 화면은 invalidateQueries 로 재조회한다(상태형 mock).
// msw 자동 수집 글롭(features/**/mocks.ts)에 걸리지 않도록 mocks.ts(핸들러 전용)와 분리.
//
// 데이터 서사: 멘토 콘솔 mock(features/mentor/mockDb.ts — 멘토 임수현·추천시스템/데이터마트/
// 트러블슈팅 팀)과 동일 세계관의 운영자 시점 복제. 역할 교차 상태 동기화(운영 수정 요청 →
// 멘토 일지 화면 반영 등)는 BE 확정 시 — 현재는 역할별 독립 상태(결합면 주석 기록).
// 미배정 2팀(이상탐지 ML·공공 데이터)은 배정 생성·409 시연용 mock 보강 데이터.

interface AdminMockTeam {
  teamId: string
  teamName: string
  cohortId: string
  memberCount: number
}

interface AdminMockAssignment {
  assignmentId: string
  teamId: string
  mentorId: string
  allocatedHours: number
  recognizedHours: number
  /** replaced(일지 보존 교체)·inactive(일지 작성 전 해제)는 보드 비노출 보존 상태 */
  status: 'active' | 'early_ended' | 'replaced' | 'inactive'
  logTemplateId: string
  /** 조기 종료 사유 — 멘토에게만 표시·수강생 비공개(05-26 §3) */
  earlyEndedReason?: string
}

interface AdminMockLog {
  logId: string
  teamId: string
  /** 일지가 귀속된 배정 — 교체 시 기존 배정 보존 판단 기준(hasLogs) */
  assignmentId: string
  /** '2026-05-26T14:00' */
  performedAt: string
  locationLabel: string
  actualMinutes: number
  recognizedHours: number | null
  excessHours: number
  status: 'draft' | 'valid' | 'change_requested'
  resubmitted: boolean
  /** fieldSnapshotId(order) → 답변. 미존재 항목은 미입력 표시 */
  answers: Record<number, string>
  history: AdminMentoringLogHistoryEntry[]
  changeRequest: {
    reasonCode: MentoringLogChangeRequestPayload['reasonCode']
    note: string
    requestedAtLabel: string
  } | null
}

interface AdminMentoringMockDb {
  cohorts: AdminMentoringCohortOption[]
  mentors: AdminMentorOption[]
  templates: AdminLogTemplateOption[]
  teams: AdminMockTeam[]
  assignments: AdminMockAssignment[]
  logs: AdminMockLog[]
}

/** 작성 당시 항목 스냅샷(템플릿 v2.1 · 6항목) — 멘토 콘솔 LOG_FIELD_SNAPSHOT 동일 구성. */
const SNAPSHOT_FIELDS: { order: number; title: string; required: boolean }[] = [
  { order: 1, title: '주요 아젠다', required: true },
  { order: 2, title: '수행 내용', required: true },
  { order: 3, title: '멘토 의견 및 요청 사항', required: true },
  { order: 4, title: '코드리뷰 내용', required: false },
  { order: 5, title: '작성 산출물', required: false },
  { order: 6, title: '활동 기록', required: false },
]

const TEMPLATE_LABEL = 'template v2.1 · 6항목'

export const adminMentoringDb: AdminMentoringMockDb = {
  cohorts: [
    {
      cohortId: 'coh_ai5_a',
      courseName: 'AI 캠프',
      cohortLabel: 'AI 5기',
      cohortName: 'AI 5기 A반',
    },
    {
      cohortId: 'coh_ai5_b',
      courseName: 'AI 캠프',
      cohortLabel: 'AI 5기',
      cohortName: 'AI 5기 B반',
    },
    {
      cohortId: 'coh_da4_a',
      courseName: '데이터 분석',
      cohortLabel: 'DA 4기',
      cohortName: 'DA 4기 A반',
    },
    {
      cohortId: 'coh_da4_b',
      courseName: '데이터 분석',
      cohortLabel: 'DA 4기',
      cohortName: 'DA 4기 B반',
    },
  ],
  mentors: [
    { mentorId: 'mentor_lim', name: '임수현' },
    { mentorId: 'mentor_kim', name: '김효원' },
    { mentorId: 'mentor_lee', name: '이지훈' },
    { mentorId: 'mentor_park', name: '박지영' },
  ],
  templates: [
    {
      templateId: 'tpl_default_v21',
      name: '기본 멘토링 일지 v2.1',
      isDefault: true,
    },
    {
      templateId: 'tpl_codereview_v10',
      name: '코드리뷰 중심 일지 v1.0',
      isDefault: false,
    },
  ],
  teams: [
    {
      teamId: 'team_rec',
      teamName: '추천시스템 팀',
      cohortId: 'coh_ai5_a',
      memberCount: 5,
    },
    // 미배정 — 추천시스템 팀과 같은 반(409 MENTOR_ASSIGNMENT_DUPLICATED_COHORT 시연)
    {
      teamId: 'team_ad',
      teamName: '이상탐지 ML 팀',
      cohortId: 'coh_ai5_a',
      memberCount: 4,
    },
    {
      teamId: 'team_ts',
      teamName: '트러블슈팅 팀',
      cohortId: 'coh_ai5_b',
      memberCount: 6,
    },
    {
      teamId: 'team_dm',
      teamName: '데이터마트 팀',
      cohortId: 'coh_da4_a',
      memberCount: 4,
    },
    // 미배정 — 빈 반(배정 생성 성공 경로)
    {
      teamId: 'team_pub',
      teamName: '공공 데이터 팀',
      cohortId: 'coh_da4_b',
      memberCount: 4,
    },
  ],
  // 배정 3건 — 멘토 콘솔 mock 의 임수현 배정(추천시스템 12h/8h · 데이터마트 10h/10h ·
  // 트러블슈팅 8h/3.5h)과 동일 수치.
  assignments: [
    {
      assignmentId: 'asgn_rec',
      teamId: 'team_rec',
      mentorId: 'mentor_lim',
      allocatedHours: 12,
      recognizedHours: 8,
      status: 'active',
      logTemplateId: 'tpl_default_v21',
    },
    {
      assignmentId: 'asgn_dm',
      teamId: 'team_dm',
      mentorId: 'mentor_lim',
      allocatedHours: 10,
      recognizedHours: 10,
      status: 'active',
      logTemplateId: 'tpl_default_v21',
    },
    {
      assignmentId: 'asgn_ts',
      teamId: 'team_ts',
      mentorId: 'mentor_lim',
      allocatedHours: 8,
      recognizedHours: 3.5,
      status: 'active',
      logTemplateId: 'tpl_default_v21',
    },
  ],
  // 일지 12건 — 멘토 콘솔 mock 의 회차·시간·요약과 동일 서사(초안 1 · 수정 요청 1 · 유효 10).
  logs: [
    {
      logId: 'log_rec_5d',
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      performedAt: '2026-05-16T14:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 90,
      recognizedHours: null,
      excessHours: 0,
      status: 'draft',
      resubmitted: false,
      answers: { 1: '콜드 스타트 사용자 처리 로직 자문' },
      history: [
        {
          atLabel: '05-16 16:02',
          actionLabel: '임시 저장 완료',
          tone: 'neutral',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_rec_4',
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      performedAt: '2026-05-26T14:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 90,
      recognizedHours: 1.5,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      // 상세 패널 대표 일지 — 멘토 콘솔 일지 상세 모달(2582:6514) 원문 답변 요약 재현.
      answers: {
        1: '프로젝트 전체 진행 현황 / 데이터 수집·저장 / 추천 시스템 구현 방향 / 중간 발표 점검',
        2: 'LangGraph 기반 추천 아키텍처 설계 리뷰. PR #142 코드 리뷰 진행. hallucination 제어 전략 도입 합의.',
        3: '도메인 데이터 검증 후 사용 결정 / 추천 로직 단순 시작 / 발표 자료는 서비스 목적 중심.',
        4: '이번 회차 미진행 — 다음 회차 PR 단위 리뷰 예정',
      },
      history: [
        {
          atLabel: '05-26 16:05',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
        {
          atLabel: '05-26 16:01',
          actionLabel: '임시 저장 완료',
          tone: 'neutral',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_rec_3',
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      performedAt: '2026-05-20T19:00',
      locationLabel: '오프라인 · 강의장 B',
      actualMinutes: 120,
      recognizedHours: 2,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '콜드 스타트 케이스 디버깅 라이브 + 팀원 1:1 점검' },
      history: [
        {
          atLabel: '05-20 21:10',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_rec_2',
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      performedAt: '2026-05-14T14:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 90,
      recognizedHours: 1.5,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '임베딩 모델 비교 실험 결과 리뷰' },
      history: [
        {
          atLabel: '05-14 15:40',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_rec_1',
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      performedAt: '2026-05-08T19:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 180,
      recognizedHours: 3,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '초기 PRD 검토 + 데이터 파이프라인 설계 자문' },
      history: [
        {
          atLabel: '05-08 22:05',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_dm_4',
      teamId: 'team_dm',
      assignmentId: 'asgn_dm',
      performedAt: '2026-05-24T19:00',
      locationLabel: '오프라인 · 강의장 B',
      actualMinutes: 120,
      recognizedHours: 2,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '집계 마트 성능 점검 + 지표 정의 검토' },
      history: [
        {
          atLabel: '05-24 21:30',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_dm_3',
      teamId: 'team_dm',
      assignmentId: 'asgn_dm',
      performedAt: '2026-05-16T19:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 150,
      recognizedHours: 2.5,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '대시보드 지표 검증 세션' },
      history: [
        {
          atLabel: '05-16 21:45',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_dm_2',
      teamId: 'team_dm',
      assignmentId: 'asgn_dm',
      performedAt: '2026-05-09T14:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 120,
      recognizedHours: 2,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: 'ETL 파이프라인 리뷰' },
      history: [
        {
          atLabel: '05-09 16:20',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_dm_1',
      teamId: 'team_dm',
      assignmentId: 'asgn_dm',
      performedAt: '2026-04-30T19:00',
      locationLabel: '오프라인 · 강의장 B',
      actualMinutes: 210,
      recognizedHours: 3.5,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '데이터 모델링 기초 자문' },
      history: [
        {
          atLabel: '04-30 22:40',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    // 수정 요청 중 — 멘토 콘솔 log_ts_3 와 동일 사유(항목 답변 불충분 · 05-23 10:20).
    // 인정 null = 재제출 전 인정 미확정(멘토 콘솔 mock 동일 표현). 운영 신규 수정 요청은
    // 기존 유효본 인정 유지(createLogChangeRequest — 05-31 정책)로 처리한다.
    {
      logId: 'log_ts_3',
      teamId: 'team_ts',
      assignmentId: 'asgn_ts',
      performedAt: '2026-05-22T19:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 60,
      recognizedHours: null,
      excessHours: 0,
      status: 'change_requested',
      resubmitted: false,
      answers: { 1: '장애 재현 시나리오 점검', 2: '장애 재현 시나리오 점검' },
      history: [
        {
          atLabel: '05-23 10:20',
          actionLabel: '수정 요청',
          tone: 'info',
          actor: '운영자',
        },
        {
          atLabel: '05-22 20:30',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: {
        reasonCode: 'template_answer_insufficient',
        note: '수행 내용이 1줄 요약뿐입니다. 회차 진행 내용을 항목 구조에 맞춰 보강한 뒤 전체 수정 후 재제출해 주세요.',
        requestedAtLabel: '2026-05-23 10:20',
      },
    },
    {
      logId: 'log_ts_2',
      teamId: 'team_ts',
      assignmentId: 'asgn_ts',
      performedAt: '2026-05-15T19:00',
      locationLabel: '오프라인 · 강의장 B',
      actualMinutes: 120,
      recognizedHours: 2,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '장애 로그 분석 실습' },
      history: [
        {
          atLabel: '05-15 21:20',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_ts_1',
      teamId: 'team_ts',
      assignmentId: 'asgn_ts',
      performedAt: '2026-05-07T14:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 90,
      recognizedHours: 1.5,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '트러블슈팅 리포트 양식 점검' },
      history: [
        {
          atLabel: '05-07 16:00',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
  ],
}

// ───────────────────────── 공통 파생 ─────────────────────────

export type AdminMentoringMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string }

const fail = (
  status: number,
  code: string,
  message: string,
): { ok: false; status: number; code: string; message: string } => ({
  ok: false,
  status,
  code,
  message,
})

const round1 = (n: number) => Math.round(n * 10) / 10

const cohortOf = (cohortId: string) =>
  adminMentoringDb.cohorts.find((c) => c.cohortId === cohortId)!

const mentorOf = (mentorId: string) =>
  adminMentoringDb.mentors.find((m) => m.mentorId === mentorId) ?? null

/** 팀의 현 노출 배정(active·early_ended) — replaced/inactive 는 보존만. */
const visibleAssignmentOf = (teamId: string) =>
  adminMentoringDb.assignments.find(
    (a) =>
      a.teamId === teamId &&
      (a.status === 'active' || a.status === 'early_ended'),
  ) ?? null

const assignmentHasLogs = (assignmentId: string) =>
  adminMentoringDb.logs.some((l) => l.assignmentId === assignmentId)

function toRow(team: AdminMockTeam): MentorAssignmentRow {
  const cohort = cohortOf(team.cohortId)
  const assignment = visibleAssignmentOf(team.teamId)
  return {
    teamId: team.teamId,
    teamName: team.teamName,
    cohortId: team.cohortId,
    cohortLabel: cohort.cohortLabel,
    courseName: cohort.courseName,
    memberCount: team.memberCount,
    assignmentId: assignment?.assignmentId ?? null,
    mentor: assignment ? mentorOf(assignment.mentorId) : null,
    allocatedHours: assignment?.allocatedHours ?? null,
    recognizedHours: assignment ? assignment.recognizedHours : null,
    recognizedPct:
      assignment && assignment.allocatedHours > 0
        ? Math.round(
            (assignment.recognizedHours / assignment.allocatedHours) * 100,
          )
        : null,
    hasLogs: assignment ? assignmentHasLogs(assignment.assignmentId) : false,
    status: assignment
      ? assignment.status === 'early_ended'
        ? 'early_ended'
        : 'active'
      : null,
    nHoursDone: assignment
      ? assignment.recognizedHours >= assignment.allocatedHours
      : false,
    logTemplateId: assignment?.logTemplateId ?? null,
  }
}

/** ['AI 5기 1', 'DA 4기 1'] 형태 분포 힌트. */
function distributionHint(labels: string[]) {
  const counts = new Map<string, number>()
  labels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1))
  return [...counts.entries()].map(([label, n]) => `${label} ${n}`).join(' · ')
}

/** GET /admin/mentors/assignments 응답 빌더. */
export function buildAssignmentsData(): MentorAssignmentsData {
  const rows = adminMentoringDb.teams.map(toRow)
  const active = rows.filter((r) => r.status === 'active')
  const unassigned = rows.filter((r) => !r.assignmentId)
  const earlyEnded = rows.filter((r) => r.status === 'early_ended')
  return {
    kpis: {
      activeMentors: new Set(active.map((r) => r.mentor?.mentorId)).size,
      activeAssignments: active.length,
      activeAssignmentsHint:
        distributionHint(active.map((r) => r.cohortLabel)) || '활성 배정 없음',
      unassignedTeams: unassigned.length,
      unassignedTeamsHint:
        distributionHint(unassigned.map((r) => r.cohortLabel)) || '미배정 없음',
      earlyEnded: earlyEnded.length,
    },
    cohorts: adminMentoringDb.cohorts,
    mentors: adminMentoringDb.mentors,
    templates: adminMentoringDb.templates,
    rows,
    summary: {
      total: rows.length,
      active: active.length,
      unassigned: unassigned.length,
    },
  }
}

// ───────────────────────── 배정 mutation (§29) ─────────────────────────

let assignmentSeq = 0

/**
 * POST /admin/mentors/assignments — 배정 생성.
 * §29 게이트: 템플릿 필수 · N시간>0(422 MENTOR_ASSIGNMENT_HOURS_INVALID) ·
 * 한 반에 한 팀만(409 MENTOR_ASSIGNMENT_DUPLICATED_COHORT).
 * 같은 팀 재배정(교체): 일지 있으면 기존 배정 replaced 보존(일지·인정 시간·평가 책임 유지),
 * 일지 작성 전이면 inactive 해제 후 새 배정 생성(05-26 §3).
 */
export function createAssignment(
  payload: Partial<MentorAssignmentCreateRequest>,
): AdminMentoringMutationResult<MentorAssignmentRow> {
  const team = adminMentoringDb.teams.find((t) => t.teamId === payload.teamId)
  if (!team) {
    return fail(404, 'ADMIN_MENTORING_TEAM_NOT_FOUND', '팀을 찾을 수 없습니다.')
  }
  if (!payload.logTemplateId) {
    // 명세 에러 코드 미등재 — FE 는 폼에서 선차단, mock 은 안내 코드로 응답(BE 확정 시 정합 TODO).
    return fail(
      422,
      'MENTOR_ASSIGNMENT_TEMPLATE_REQUIRED',
      '배정 폼에서 일지 템플릿 필수 선택 안내',
    )
  }
  if (
    !adminMentoringDb.templates.some(
      (t) => t.templateId === payload.logTemplateId,
    )
  ) {
    return fail(
      404,
      'ADMIN_MENTORING_TEMPLATE_NOT_FOUND',
      '일지 템플릿을 찾을 수 없습니다.',
    )
  }
  if (!payload.mentorId || !mentorOf(payload.mentorId)) {
    return fail(
      404,
      'ADMIN_MENTORING_MENTOR_NOT_FOUND',
      '멘토를 찾을 수 없습니다.',
    )
  }
  if (!payload.allocatedHours || payload.allocatedHours <= 0) {
    return fail(
      422,
      'MENTOR_ASSIGNMENT_HOURS_INVALID',
      '배정 N시간은 0보다 커야 합니다.',
    )
  }
  // 한 반에 한 팀만 — 같은 반의 "다른 팀"에 활성 배정이 있으면 차단(같은 팀 교체는 허용).
  const cohortConflict = adminMentoringDb.teams.some(
    (t) =>
      t.cohortId === team.cohortId &&
      t.teamId !== team.teamId &&
      visibleAssignmentOf(t.teamId)?.status === 'active',
  )
  if (cohortConflict) {
    return fail(
      409,
      'MENTOR_ASSIGNMENT_DUPLICATED_COHORT',
      '같은 반 중복 배정 — 동일 cohort에 이미 팀이 배정되어 있습니다 (저장 차단).',
    )
  }
  const existing = visibleAssignmentOf(team.teamId)
  if (existing) {
    // 덮어쓰기 금지 — 일지 존재 시 기존 배정·일지·인정 시간·평가 책임 보존(replaced).
    existing.status = assignmentHasLogs(existing.assignmentId)
      ? 'replaced'
      : 'inactive'
  }
  assignmentSeq += 1
  adminMentoringDb.assignments.push({
    assignmentId: `asgn_new_${assignmentSeq}`,
    teamId: team.teamId,
    mentorId: payload.mentorId,
    allocatedHours: payload.allocatedHours,
    recognizedHours: 0,
    status: 'active',
    logTemplateId: payload.logTemplateId,
  })
  return { ok: true, data: toRow(team) }
}

/**
 * PATCH /admin/mentors/assignments/{assignmentId} — 멘토 교체(일지 작성 전에만).
 * 일지가 하나라도 있으면 409 MENTOR_ASSIGNMENT_HAS_LOGS — FE 는 '기존 배정 보존 +
 * 새 배정 생성'(createAssignment)으로 안내한다.
 */
export function changeAssignmentMentor(
  assignmentId: string,
  mentorId: string | undefined,
): AdminMentoringMutationResult<MentorAssignmentRow> {
  const assignment = adminMentoringDb.assignments.find(
    (a) => a.assignmentId === assignmentId && a.status === 'active',
  )
  if (!assignment) {
    return fail(
      404,
      'ADMIN_MENTORING_ASSIGNMENT_NOT_FOUND',
      '배정을 찾을 수 없습니다.',
    )
  }
  if (!mentorId || !mentorOf(mentorId)) {
    return fail(
      404,
      'ADMIN_MENTORING_MENTOR_NOT_FOUND',
      '멘토를 찾을 수 없습니다.',
    )
  }
  if (assignmentHasLogs(assignmentId)) {
    return fail(
      409,
      'MENTOR_ASSIGNMENT_HAS_LOGS',
      '일지가 있는 배정은 수정할 수 없습니다 — 기존 배정을 보존하고 새 배정을 생성하세요.',
    )
  }
  assignment.mentorId = mentorId
  const team = adminMentoringDb.teams.find(
    (t) => t.teamId === assignment.teamId,
  )!
  return { ok: true, data: toRow(team) }
}

/**
 * PATCH /admin/mentors/assignments/{assignmentId}/allocated-hours — N시간 수정(언제든).
 * 감소 → 기존 인정 시간 유지(새 기준 충족 시 즉시 N시간 완료) /
 * 증가 → 최신 유효 일지 기준 재계산(완료 팀도 진행 중 복귀) — 05-26 §3.
 */
export function updateAllocatedHours(
  assignmentId: string,
  allocatedHours: number | undefined,
): AdminMentoringMutationResult<MentorAssignmentRow> {
  const assignment = adminMentoringDb.assignments.find(
    (a) =>
      a.assignmentId === assignmentId &&
      (a.status === 'active' || a.status === 'early_ended'),
  )
  if (!assignment) {
    return fail(
      404,
      'ADMIN_MENTORING_ASSIGNMENT_NOT_FOUND',
      '배정을 찾을 수 없습니다.',
    )
  }
  if (!allocatedHours || allocatedHours <= 0) {
    return fail(
      422,
      'MENTOR_ASSIGNMENT_HOURS_INVALID',
      '배정 N시간은 0보다 커야 합니다.',
    )
  }
  if (allocatedHours > assignment.allocatedHours) {
    // 증가 — 유효 일지 실제 진행 시간 합 기준 재계산(잔여까지만 인정, SSOT 수식).
    const validActualHours =
      adminMentoringDb.logs
        .filter((l) => l.assignmentId === assignmentId && l.status === 'valid')
        .reduce((sum, l) => sum + l.actualMinutes, 0) / 60
    assignment.recognizedHours = round1(
      Math.min(validActualHours, allocatedHours),
    )
  }
  // 감소 — 기존 인정 시간 유지(차감·소급 없음).
  assignment.allocatedHours = allocatedHours
  const team = adminMentoringDb.teams.find(
    (t) => t.teamId === assignment.teamId,
  )!
  return { ok: true, data: toRow(team) }
}

/**
 * POST /admin/mentors/assignments/{assignmentId}/early-end — 조기 종료.
 * 사유 필수(422 MENTOR_EARLY_END_REASON_REQUIRED) · 평가·추천 가능 상태로 전환.
 * 사유는 멘토에게만 표시·수강생 비공개(멘토 측 반영은 BE 확정 시 — 역할 교차 주석).
 */
export function earlyEndAssignment(
  assignmentId: string,
  reason: string | undefined,
): AdminMentoringMutationResult<MentorAssignmentRow> {
  const assignment = adminMentoringDb.assignments.find(
    (a) => a.assignmentId === assignmentId && a.status === 'active',
  )
  if (!assignment) {
    return fail(
      404,
      'ADMIN_MENTORING_ASSIGNMENT_NOT_FOUND',
      '배정을 찾을 수 없습니다.',
    )
  }
  if (!reason?.trim()) {
    return fail(
      422,
      'MENTOR_EARLY_END_REASON_REQUIRED',
      '조기 종료 사유 입력이 필요합니다.',
    )
  }
  assignment.status = 'early_ended'
  assignment.earlyEndedReason = reason.trim()
  const team = adminMentoringDb.teams.find(
    (t) => t.teamId === assignment.teamId,
  )!
  return { ok: true, data: toRow(team) }
}

// ───────────────────────── 일지 read model (§30) ─────────────────────────

const dateTimeLabelOf = (iso: string) =>
  `${iso.slice(5, 10)} ${iso.slice(11, 16)}`

/** '2026-05-26T14:00' + 90분 → '2026-05-26 14:00 → 15:30' */
function conductedRangeLabelOf(iso: string, minutes: number) {
  const [h, m] = iso.slice(11, 16).split(':').map(Number)
  const total = h * 60 + m + minutes
  const pad = (n: number) => String(n).padStart(2, '0')
  const end = `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} → ${end}`
}

const teamNameOf = (teamId: string) =>
  adminMentoringDb.teams.find((t) => t.teamId === teamId)?.teamName ?? ''

const mentorNameOfLog = (log: AdminMockLog) => {
  const assignment = adminMentoringDb.assignments.find(
    (a) => a.assignmentId === log.assignmentId,
  )
  return (assignment && mentorOf(assignment.mentorId)?.name) || '임수현'
}

const sortedLogs = () =>
  [...adminMentoringDb.logs].sort((a, b) =>
    b.performedAt.localeCompare(a.performedAt),
  )

function toLogRow(log: AdminMockLog): AdminMentoringLogRow {
  return {
    logId: log.logId,
    teamId: log.teamId,
    teamName: teamNameOf(log.teamId),
    mentorName: mentorNameOfLog(log),
    performedAtLabel: dateTimeLabelOf(log.performedAt),
    actualMinutes: log.actualMinutes,
    recognizedHours: log.recognizedHours,
    excessHours: log.excessHours,
    status: log.status,
    resubmitted: log.resubmitted,
  }
}

/** GET /admin/mentoring/logs 응답 빌더 — KPI·요약은 상태에서 파생(상태 변경 즉시 반영). */
export function buildAdminLogsData(): AdminMentoringLogsData {
  const logs = sortedLogs()
  const valid = logs.filter((l) => l.status === 'valid')
  const changeRequested = logs.filter((l) => l.status === 'change_requested')
  const drafts = logs.filter((l) => l.status === 'draft')
  return {
    kpis: {
      valid: valid.length,
      changeRequested: changeRequested.length,
      draft: drafts.length,
      resubmitted: valid.filter((l) => l.resubmitted).length,
    },
    monthlySubmitted: logs.length - drafts.length,
    pendingCount: changeRequested.length,
    rows: logs.map(toLogRow),
  }
}

/** GET /admin/mentoring/logs/{logId} 응답 빌더 — 미존재 시 null(404 처리). */
export function buildAdminLogDetail(
  logId: string,
): AdminMentoringLogDetail | null {
  const log = adminMentoringDb.logs.find((l) => l.logId === logId)
  if (!log) return null
  // 회차 = 같은 팀 "제출된" 일지의 진행 일시 오름차순 순번(초안은 제출 시 회차 확정 —
  // 작성 중 초안은 제출분 다음 회차로 표기).
  const submittedLogs = adminMentoringDb.logs
    .filter((l) => l.teamId === log.teamId && l.status !== 'draft')
    .sort((a, b) => a.performedAt.localeCompare(b.performedAt))
  const submittedIndex = submittedLogs.findIndex((l) => l.logId === logId)
  const round =
    submittedIndex >= 0 ? submittedIndex + 1 : submittedLogs.length + 1
  const snapshotItems: AdminMentoringLogSnapshotItem[] = SNAPSHOT_FIELDS.map(
    (field) => ({
      ...field,
      answer: log.answers[field.order] ?? '',
    }),
  )
  return {
    logId: log.logId,
    teamId: log.teamId,
    teamName: teamNameOf(log.teamId),
    roundLabel: `${round}회차`,
    mentorName: mentorNameOfLog(log),
    conductedRangeLabel: conductedRangeLabelOf(
      log.performedAt,
      log.actualMinutes,
    ),
    actualMinutes: log.actualMinutes,
    recognizedHours: log.recognizedHours,
    excessHours: log.excessHours,
    locationLabel: log.locationLabel,
    templateLabel: TEMPLATE_LABEL,
    status: log.status,
    resubmitted: log.resubmitted,
    snapshotItems,
    history: log.history,
    changeRequest: log.changeRequest && {
      ...log.changeRequest,
      reasonLabel:
        MENTORING_LOG_CHANGE_REASON_LABEL[log.changeRequest.reasonCode],
    },
  }
}

// ───────────────────────── 일지 수정 요청 mutation (§30) ─────────────────────────

/** 'MM-DD HH:mm' 현재 시각 — 이력 타임스탬프용. */
function nowLabel() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * POST /admin/mentoring/logs/{logId}/change-requests — 수정 요청.
 * 게이트: 초안 대상 불가(422) · 미해결 요청 logId당 1건(409
 * MENTORING_LOG_CHANGE_REQUEST_EXISTS) · 사유 코드 + 상세 메모 필수(422).
 * 수정 요청 중에도 기존 유효본 인정 시간·평가 가능 상태 유지(인정 값 변경 없음).
 * 멘토 재제출(즉시 자동 유효·재계산)은 멘토 콘솔 소관 — 역할 교차 반영은 BE 확정 시.
 */
export function createLogChangeRequest(
  logId: string,
  payload: Partial<MentoringLogChangeRequestPayload> | undefined,
): AdminMentoringMutationResult<AdminMentoringLogDetail> {
  const log = adminMentoringDb.logs.find((l) => l.logId === logId)
  if (!log) {
    return fail(
      404,
      'ADMIN_MENTORING_LOG_NOT_FOUND',
      '일지를 찾을 수 없습니다.',
    )
  }
  if (log.status === 'draft') {
    return fail(
      422,
      'MENTORING_LOG_CHANGE_REQUEST_DRAFT_FORBIDDEN',
      '초안 일지는 수정 요청 대상이 아닙니다.',
    )
  }
  if (log.status === 'change_requested') {
    return fail(
      409,
      'MENTORING_LOG_CHANGE_REQUEST_EXISTS',
      '미해결 수정 요청이 이미 있습니다 — 멘토 재제출 후 다시 요청할 수 있습니다.',
    )
  }
  const reasonCode = payload?.reasonCode
  if (
    !reasonCode ||
    !(reasonCode in MENTORING_LOG_CHANGE_REASON_LABEL) ||
    !payload?.note?.trim()
  ) {
    return fail(
      422,
      'MENTORING_LOG_CHANGE_REQUEST_REASON_REQUIRED',
      '수정 요청에는 사유 코드와 상세 메모가 필요합니다.',
    )
  }
  log.status = 'change_requested'
  // 기존 유효본 인정 시간 유지 — recognizedHours/excessHours 그대로(배정 누적도 불변).
  log.changeRequest = {
    reasonCode,
    note: payload.note.trim(),
    requestedAtLabel: nowLabel(),
  }
  log.history = [
    {
      atLabel: nowLabel(),
      actionLabel: '수정 요청',
      tone: 'info',
      actor: '운영자',
    },
    ...log.history,
  ]
  return { ok: true, data: buildAdminLogDetail(logId)! }
}
