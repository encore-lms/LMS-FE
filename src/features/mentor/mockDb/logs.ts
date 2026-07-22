// 멘토 mock — 멘토링 일지 목록·상세·작성 대상·초안·제출 mutation(M3).
import type {
  MentoringLogDetailData,
  MentoringLogDraftPayload,
  MentoringLogFieldSnapshot,
  MentoringLogListItem,
  MentoringLogTargetsData,
  MentoringLogsData,
  MentoringPlaceType,
} from '../types'
import { MENTORING_PLACE_TYPE_LABEL } from '../types'
import { LOG_FIELD_SNAPSHOT, mentorDb } from './db'
import type { MentorMockLog, MentorMockTeam } from './db'
import {
  dateLabelOf,
  dowOf,
  endTimeLabelOf,
  nowStamp,
  placeTypeOfLabel,
  recognizeMinutes,
  round1,
  roundOf,
  submittedLogs,
  timeLabelOf,
  toAssignment,
  yearLabelOf,
} from './shared'
// ──────────────────── 멘토링 일지 · 학생 상세 (M3) ────────────────────

/** 일지별 초과 시간 — 실제 − 인정(유효 일지만, 잔여까지만 인정 정책의 보존 기록). */
const excessOf = (log: MentorMockLog) =>
  log.status === 'valid' && log.recognizedHours != null
    ? round1(Math.max(log.actualMinutes / 60 - log.recognizedHours, 0))
    : 0

/** 답변 미보유 구 mock 일지(M1)용 기본 답변 — summary 기반 보강(초안은 비우지 않음). */
function defaultAnswersOf(log: MentorMockLog): Record<string, string> {
  return {
    fld_agenda: log.summary,
    fld_progress: `● 진행 내용\n- ${log.summary}\n- 논의 결과 정리 및 다음 액션 역할 분담`,
    fld_opinion: '논의된 후속 액션을 다음 회차 전까지 팀 문서로 정리해 주세요.',
  }
}

const splitLocation = (label: string): [string, string] => {
  const [typeLabel, detail = ''] = label.split(' · ')
  return [typeLabel, detail]
}

const composeLocationLabel = (placeType: MentoringPlaceType, detail: string) =>
  detail.trim()
    ? `${MENTORING_PLACE_TYPE_LABEL[placeType]} · ${detail.trim()}`
    : MENTORING_PLACE_TYPE_LABEL[placeType]

/** 'HH:mm' 간격(분) — 종료가 시작 이전이면 음수(검증에서 422). */
function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

/** 주요 아젠다 첫 줄 → 목록 요지 파생(불릿 기호 제거). */
const summaryOfAnswers = (answers: Record<string, string>) =>
  answers.fld_agenda
    ?.split('\n')
    .map((line) => line.replace(/^[-•●\s]+/, '').trim())
    .find(Boolean)

function toLogListItem(
  team: MentorMockTeam,
  log: MentorMockLog,
): MentoringLogListItem {
  const [typeLabel, placeDetail] = splitLocation(log.locationLabel)
  return {
    logId: log.logId,
    teamId: team.teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    summary: log.summary,
    dateLabel: dateLabelOf(log.performedAt),
    timeLabel: timeLabelOf(log.performedAt),
    yearLabel: yearLabelOf(log.performedAt),
    placeType: placeTypeOfLabel(typeLabel),
    placeDetail,
    actualMinutes: log.actualMinutes,
    recognizedHours: log.recognizedHours,
    excessHours: excessOf(log),
    status: log.status,
    statusNote: log.statusNote,
    performedAt: log.performedAt,
  }
}

/** GET /mentor/v1/mentoring-logs 응답 빌더 — 진행 일시 내림차순(Figma 2553:4040). */
export function buildMentoringLogsData(): MentoringLogsData {
  return {
    logs: mentorDb.teams
      .flatMap((team) => team.logs.map((log) => toLogListItem(team, log)))
      .sort((a, b) => b.performedAt.localeCompare(a.performedAt)),
  }
}

function toLogDetail(
  team: MentorMockTeam,
  log: MentorMockLog,
): MentoringLogDetailData {
  const assignment = toAssignment(team)
  const [typeLabel, placeDetail] = splitLocation(log.locationLabel)
  const sessionDate = log.performedAt.slice(0, 10)
  const startTime = timeLabelOf(log.performedAt)
  const endTime = endTimeLabelOf(log.performedAt, log.actualMinutes)
  const answers =
    log.answers ?? (log.status === 'draft' ? {} : defaultAnswersOf(log))
  const attendedIds = log.attendedIds ?? team.members.map((m) => m.studentId)
  return {
    logId: log.logId,
    round: roundOf(team, log),
    status: log.status,
    statusNote: log.statusNote,
    teamId: team.teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    mentorName: mentorDb.mentorName,
    summary: log.summary,
    sessionLabel: `${sessionDate}(${dowOf(log.performedAt)}) ${startTime} → ${endTime}`,
    sessionDate,
    startTime,
    endTime,
    placeType: placeTypeOfLabel(typeLabel),
    placeDetail,
    actualMinutes: log.actualMinutes,
    recognizedHours: log.recognizedHours,
    excessHours: excessOf(log),
    teamHours: {
      accumulatedHours: assignment.accumulatedHours,
      allocatedHours: assignment.allocatedHours,
      remainingHours: assignment.remainingHours,
    },
    attendees: team.members.map((m) => ({
      ...m,
      attended: attendedIds.includes(m.studentId),
    })),
    attendedCount: team.members.filter((m) => attendedIds.includes(m.studentId))
      .length,
    memberCount: team.members.length,
    answers: LOG_FIELD_SNAPSHOT.map((field) => ({
      field,
      value: answers[field.fieldSnapshotId] ?? '',
    })),
    // 제출 시각 미보유 구 mock 일지는 종료 시각으로 파생(초안은 미제출 — null).
    submittedAtLabel:
      log.status === 'draft'
        ? null
        : (log.submittedAtLabel ?? `${sessionDate} ${endTime}`),
    changeRequest: log.changeRequest ?? null,
    photos: log.photos ?? [],
  }
}

/** GET /mentor/v1/mentoring-logs/{logId} — 미존재 시 null(404 처리). */
export function buildMentoringLogDetail(
  logId: string,
): MentoringLogDetailData | null {
  for (const team of mentorDb.teams) {
    const log = team.logs.find((l) => l.logId === logId)
    if (log) return toLogDetail(team, log)
  }
  return null
}

/**
 * GET /mentor/v1/mentoring-logs/targets — 작성 대상 팀.
 * N시간 완료 팀도 추가 일지 가능(인정 0 — '초과 멘토링 · 활동 인정 시간 없음').
 * 조기 종료 팀 제외 규칙은 BE 확정 대기 — 보수적으로 제외.
 */
export function buildMentoringLogTargets(): MentoringLogTargetsData {
  return {
    targets: mentorDb.teams
      .filter((t) => t.status !== 'early_ended')
      .map((team) => {
        const a = toAssignment(team)
        return {
          teamId: team.teamId,
          cohortLabel: team.cohortLabel,
          teamName: team.teamName,
          nextRound: submittedLogs(team).length + 1,
          allocatedHours: a.allocatedHours,
          accumulatedHours: a.accumulatedHours,
          recognizedHours: a.recognizedHours,
          remainingHours: a.remainingHours,
          members: team.members,
        }
      }),
  }
}

/**
 * GET /mentor/v1/teams/{teamId}/log-field-snapshot — 운영 적용 항목 스냅샷.
 * mock 은 전 팀 동일(팀별 항목 설정 분기는 운영 멘토링 PR·BE 확정 시) — 미배정 팀 null(403).
 */
export function buildLogFieldSnapshot(
  teamId: string,
): MentoringLogFieldSnapshot[] | null {
  return mentorDb.teams.some((t) => t.teamId === teamId)
    ? LOG_FIELD_SNAPSHOT
    : null
}

export type MentoringLogMutationResult =
  | { ok: true; log: MentoringLogDetailData }
  | { ok: false; status: number; code: string; message: string }

const mockLogError = (
  status: number,
  code: string,
  message: string,
): MentoringLogMutationResult => ({ ok: false, status, code, message })

// 코드명은 명세 에러 22종 대조 전 추정(MENTOR_LOG_* 계열) — BE 확정 시 정합 TODO.
const logRequired422 = (message: string) =>
  mockLogError(422, 'MENTOR_LOG_REQUIRED_FIELD_MISSING', message)

function findMockLog(
  logId: string,
): { team: MentorMockTeam; log: MentorMockLog } | null {
  for (const team of mentorDb.teams) {
    const log = team.logs.find((l) => l.logId === logId)
    if (log) return { team, log }
  }
  return null
}

/** 초안·재제출 공용 — payload 의 입력값을 mock 일지에 반영(부분 입력 허용). */
function applyLogPayload(
  log: MentorMockLog,
  payload: MentoringLogDraftPayload,
) {
  if (payload.sessionDate && payload.startTime) {
    log.performedAt = `${payload.sessionDate}T${payload.startTime}`
  }
  if (payload.startTime && payload.endTime) {
    log.actualMinutes = Math.max(
      minutesBetween(payload.startTime, payload.endTime),
      0,
    )
  }
  if (payload.placeType) {
    log.locationLabel = composeLocationLabel(
      payload.placeType,
      payload.placeDetail ?? splitLocation(log.locationLabel)[1],
    )
  } else if (payload.placeDetail !== undefined) {
    const [typeLabel] = splitLocation(log.locationLabel)
    log.locationLabel = payload.placeDetail.trim()
      ? `${typeLabel} · ${payload.placeDetail.trim()}`
      : typeLabel
  }
  if (payload.attendedIds) log.attendedIds = [...payload.attendedIds]
  if (payload.answers) {
    log.answers = Object.fromEntries(
      payload.answers.map((a) => [a.fieldSnapshotId, a.value]),
    )
    log.summary = summaryOfAnswers(log.answers) ?? log.summary
  }
}

let draftSeq = 1

/**
 * PUT /mentor/v1/mentoring-logs/draft — 초안 신규 저장(자유 수정·인정 시간 미반영).
 * 초안은 시간 차감·팀 누적에 영향 없음(DRAFT, 03_멘토.md §5).
 */
export function saveMentoringLogDraft(
  payload: MentoringLogDraftPayload,
): MentoringLogMutationResult {
  const team = mentorDb.teams.find((t) => t.teamId === payload.teamId)
  if (!team)
    return mockLogError(
      403,
      'MENTOR_SCOPE_FORBIDDEN',
      '본인에게 배정된 팀이 아닙니다.',
    )
  const log: MentorMockLog = {
    logId: `log_draft_${draftSeq++}`,
    performedAt:
      payload.sessionDate && payload.startTime
        ? `${payload.sessionDate}T${payload.startTime}`
        : nowStamp(),
    locationLabel: composeLocationLabel(
      payload.placeType ?? 'online',
      payload.placeDetail ?? '',
    ),
    actualMinutes: 0,
    recognizedHours: null,
    status: 'draft',
    summary: '(작성 중)',
    attendedIds: payload.attendedIds ?? [],
    answers: {},
  }
  applyLogPayload(log, payload)
  team.logs.unshift(log)
  return { ok: true, log: toLogDetail(team, log) }
}

/** PUT /mentor/v1/mentoring-logs/{logId}/draft — 초안 갱신. 대상 팀 변경은 미지원(작성 시 고정). */
export function updateMentoringLogDraft(
  logId: string,
  payload: MentoringLogDraftPayload,
): MentoringLogMutationResult {
  const found = findMockLog(logId)
  if (!found)
    return mockLogError(404, 'MENTOR_LOG_NOT_FOUND', '일지를 찾을 수 없습니다.')
  if (found.log.status !== 'draft')
    // 유효 일지 수정·삭제 endpoint 없음(제출 후 임의 수정 불가) — 수정 요청 응답은 resubmit 전용.
    return mockLogError(
      409,
      'MENTOR_LOG_DIRECT_EDIT_FORBIDDEN',
      '제출된 일지는 임시 저장할 수 없습니다.',
    )
  applyLogPayload(found.log, payload)
  return { ok: true, log: toLogDetail(found.team, found.log) }
}

/** 제출·재제출 공통 필수 검증 — 422 (FE는 폼 검증으로 선차단). */
function validateLogForSubmit(
  team: MentorMockTeam,
  log: MentorMockLog,
): MentoringLogMutationResult | null {
  if (log.actualMinutes <= 0)
    return logRequired422(
      '시작·종료 시각을 분 단위까지 입력해 주세요 (실제 진행 시간 > 0).',
    )
  if (!splitLocation(log.locationLabel)[1].trim())
    return logRequired422('상세 장소를 입력해 주세요.')
  const attendedIds = log.attendedIds ?? team.members.map((m) => m.studentId)
  if (attendedIds.length === 0)
    return logRequired422('참석 멘티를 1명 이상 선택해 주세요.')
  const answers = log.answers ?? {}
  for (const field of LOG_FIELD_SNAPSHOT) {
    const value = (answers[field.fieldSnapshotId] ?? '').trim()
    if (field.required && !value)
      return logRequired422(`필수 항목 '${field.name}'을(를) 작성해 주세요.`)
    if (field.charLimit != null && value.length > field.charLimit)
      return mockLogError(
        422,
        'MENTOR_LOG_ANSWER_LENGTH_EXCEEDED',
        `'${field.name}'은(는) ${field.charLimit}자 이내로 작성해 주세요.`,
      )
  }
  return null
}

/**
 * POST /mentor/v1/mentoring-logs/{logId}/{submit|resubmit} — 제출 즉시 자동 유효.
 * 인정 시간 SSOT 수식(recognizeMinutes)으로 재계산해 M1 팀 누적(accumulated/recognized)과
 * 팀 상태에 즉시 반영(상태형 mock). 완료 예약 파생(deriveCompletedRequests)도 자동 동기화.
 * 재제출 = 수정 요청 일지 전체 수정 후 즉시 자동 유효(폐기·반려 없음, 05-31 확정).
 */
export function submitMentoringLog(
  logId: string,
  mode: 'submit' | 'resubmit',
  payload?: MentoringLogDraftPayload,
): MentoringLogMutationResult {
  const found = findMockLog(logId)
  if (!found)
    return mockLogError(404, 'MENTOR_LOG_NOT_FOUND', '일지를 찾을 수 없습니다.')
  const { team, log } = found
  if (mode === 'submit' && log.status !== 'draft')
    return mockLogError(
      409,
      'MENTOR_LOG_ALREADY_SUBMITTED',
      '이미 제출된 일지입니다. 수정 요청 상태에서만 재제출할 수 있습니다.',
    )
  if (mode === 'resubmit' && log.status !== 'change_requested')
    return mockLogError(
      409,
      'MENTOR_LOG_NOT_CHANGE_REQUESTED',
      '수정 요청 상태의 일지만 재제출할 수 있습니다.',
    )
  if (payload) applyLogPayload(log, payload)
  const invalid = validateLogForSubmit(team, log)
  if (invalid) return invalid

  // 인정 = min(실제, max(잔여, 0)) — 초과분은 기록 보존·인정 없음(잔여까지만).
  const rec = recognizeMinutes(team, log.actualMinutes)
  // 정본(실 BE): 제출 → 'submitted'(승인 대기) → 운영 매니저 승인(POST .../approve) 후 'valid'
  // + 인정 시간 산입. mock은 승인 흐름 미배선이라 제출을 즉시 'valid'로 단순화한다(실 BE
  // 연동 시 승인 대기 경유). UI 카피·상태 칩은 승인 대기 흐름을 이미 반영한다.
  log.status = 'valid'
  log.statusNote = undefined
  log.recognizedHours = rec.recognizedHours
  // ChangeRequest 해소(resolvedAt 기록) — mock 은 제거로 갈음(이력 보존은 BE 몫).
  log.changeRequest = undefined
  log.submittedAtLabel = nowStamp().replace('T', ' ')
  team.accumulatedHours = round1(team.accumulatedHours + log.actualMinutes / 60)
  team.recognizedHours = round1(team.recognizedHours + rec.recognizedHours)
  // 팀 상태 전이 — N시간 완료 시 평가 필요, 수정 요청 해소·일지 필요 해소는 진행 중 복귀.
  if (team.status !== 'completed' && team.status !== 'early_ended') {
    if (toAssignment(team).nHoursDone) team.status = 'evaluation_needed'
    else if (team.status === 'log_needed' || team.status === 'change_requested')
      team.status = 'in_progress'
  }
  return { ok: true, log: toLogDetail(team, log) }
}
