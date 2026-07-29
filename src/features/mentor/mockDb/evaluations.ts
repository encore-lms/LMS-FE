// 멘토 mock — 팀 평가 시트·초안·제출 mutation(M4).
import type {
  EvaluationScoreTuple,
  MentorEvaluationDraftPayload,
  MentorEvaluationMemberEntry,
  MentorEvaluationSheetData,
  MentorEvaluationStatus,
  MentorEvaluationSubmission,
  MentorEvaluationsData,
} from '../types'
import { EVALUATION_AXIS_LABELS, mentorDb } from './db'
import type { MentorMockEvaluation, MentorMockTeam } from './db'
import { DOW_LABELS, nowStamp, round1, toAssignment } from './shared'
// ───────────────────────── 평가 · 추천 (M4) ─────────────────────────

export const EMPTY_SCORES: EvaluationScoreTuple = [null, null, null, null, null]

/** 점수 유효성 — 1~5 정수(범위 미확정 TODO — Figma '0~5점 필수' 카피와 충돌 openQuestion). */
const isValidScore = (s: number | null): s is number =>
  s != null && Number.isInteger(s) && s >= 1 && s <= 5

/** 평가 입력 완료 — 5축 전 점수 + 줄글 코멘트(필수, 500자 이내). */
const isCompleteEvaluationEntry = (entry: {
  scores: EvaluationScoreTuple
  comment: string
}) =>
  entry.scores.every(isValidScore) &&
  entry.comment.trim().length > 0 &&
  entry.comment.length <= 500

/** 평가 가능 게이트 — N시간 완료 또는 운영자 조기 종료(P0_35 · 03_멘토.md §6). */
const isEvaluationEligible = (team: MentorMockTeam) =>
  toAssignment(team).nHoursDone || team.status === 'early_ended'

export const avgOf = (scores: number[]) =>
  round1(scores.reduce((sum, s) => sum + s, 0) / scores.length)

/** '2026-03-19 21:14' + 24h → '2026-03-20(금) 21:14 까지' (Figma 원문 행 표기 전용). */
export function plus24hLabel(stamp: string) {
  const d = new Date(stamp.replace(' ', 'T'))
  d.setDate(d.getDate() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}(${DOW_LABELS[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())} 까지`
}

/** 팀원 + 초안/제출본 병합 — 평가 카드 행(read model). */
function evaluationEntriesOf(
  team: MentorMockTeam,
): MentorEvaluationMemberEntry[] {
  const submitted = mentorDb.evaluations.find((e) => e.teamId === team.teamId)
  const draft = mentorDb.evaluationDrafts[team.teamId]
  return team.members.map((member) => {
    const sub = submitted?.byStudent[member.studentId]
    const d = draft?.entries.find((e) => e.studentId === member.studentId)
    return {
      ...member,
      scores: sub
        ? ([...sub.axes] as EvaluationScoreTuple)
        : d
          ? ([...d.scores] as EvaluationScoreTuple)
          : ([...EMPTY_SCORES] as EvaluationScoreTuple),
      comment: sub ? (sub.comment ?? '') : (d?.comment ?? ''),
    }
  })
}

/** GET /mentor/v1/teams/{teamId}/evaluation — 미배정 팀이면 null(403 처리). */
export function buildTeamEvaluationSheet(
  teamId: string,
): MentorEvaluationSheetData | null {
  const team = mentorDb.teams.find((t) => t.teamId === teamId)
  if (!team) return null
  const assignment = toAssignment(team)
  const submitted = mentorDb.evaluations.find((e) => e.teamId === teamId)
  const eligible = isEvaluationEligible(team)
  const members = evaluationEntriesOf(team)
  const status: MentorEvaluationStatus = submitted
    ? 'submitted'
    : !eligible
      ? 'not_eligible'
      : members.every(isCompleteEvaluationEntry)
        ? 'ready_to_submit'
        : 'draft'
  return {
    teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    memberCount: team.members.length,
    allocatedHours: assignment.allocatedHours,
    recognizedHours: assignment.recognizedHours,
    eligible,
    eligibleLabel:
      team.status === 'early_ended'
        ? '조기 종료 · 평가 가능'
        : assignment.nHoursDone
          ? 'N시간 완료 · 평가 가능'
          : 'N시간 미완료 · 평가 잠금',
    lockReasonLabel: eligible
      ? null
      : `N시간 완료 후 활성 — 인정 ${assignment.recognizedHours}h / 배정 ${assignment.allocatedHours}h`,
    status,
    submittedAtLabel:
      submitted?.submittedAtLabel ?? submitted?.writtenAtLabel ?? null,
    members,
  }
}

export type MentorEvaluationMutationResult =
  | { ok: true; sheet: MentorEvaluationSheetData }
  | { ok: false; status: number; code: string; message: string }

const evalError = (
  status: number,
  code: string,
  message: string,
): MentorEvaluationMutationResult => ({ ok: false, status, code, message })

/** payload 정규화 — 팀원 외 entry 제거 + 점수 범위 클램프 + 코멘트 500자 컷. */
function normalizeEvaluationPayload(
  team: MentorMockTeam,
  payload: MentorEvaluationDraftPayload,
): MentorEvaluationDraftPayload {
  return {
    entries: team.members.map((member) => {
      const entry = payload.entries.find(
        (e) => e.studentId === member.studentId,
      )
      return {
        studentId: member.studentId,
        scores: (entry?.scores ?? EMPTY_SCORES).map((s) =>
          isValidScore(s) ? s : null,
        ) as EvaluationScoreTuple,
        comment: (entry?.comment ?? '').slice(0, 500),
      }
    }),
  }
}

/** 평가 공통 guard — 미배정 403 · 제출 후 수정 불가 409 · 게이트 422. */
function guardEvaluation(
  teamId: string,
): { team: MentorMockTeam } | MentorEvaluationMutationResult {
  const team = mentorDb.teams.find((t) => t.teamId === teamId)
  if (!team)
    return evalError(
      403,
      'MENTOR_SCOPE_FORBIDDEN',
      '본인에게 배정된 팀이 아닙니다.',
    )
  if (mentorDb.evaluations.some((e) => e.teamId === teamId))
    // 최종 제출 후 PATCH/DELETE endpoint 없음(05-31 확정) — 코드명은 명세 대조 전 추정 TODO.
    return evalError(
      409,
      'MENTOR_EVALUATION_ALREADY_SUBMITTED',
      '제출된 평가는 수정할 수 없습니다.',
    )
  if (!isEvaluationEligible(team))
    return evalError(
      422,
      'MENTOR_EVALUATION_NOT_ELIGIBLE',
      'N시간 완료 또는 조기 종료 후에 평가할 수 있습니다.',
    )
  return { team }
}

/** PUT /mentor/v1/teams/{teamId}/evaluation/draft — 부분 입력 그대로 보관(자동/임시 저장). */
export function saveEvaluationDraft(
  teamId: string,
  payload: MentorEvaluationDraftPayload,
): MentorEvaluationMutationResult {
  const guarded = guardEvaluation(teamId)
  if ('ok' in guarded) return guarded
  mentorDb.evaluationDrafts[teamId] = normalizeEvaluationPayload(
    guarded.team,
    payload,
  )
  return { ok: true, sheet: buildTeamEvaluationSheet(teamId)! }
}

/**
 * POST /mentor/v1/teams/{teamId}/evaluation/submit — 최종 제출(submittedAt/lockedAt).
 * 전원 5축 점수 + 줄글 코멘트 필수(미충족 422), 제출 후 수정·삭제 불가(409).
 * 제출 후에도 팀 상태는 evaluation_needed 유지 — 추천 제출까지 완료해야 completed
 * (활동 인정 요건 = 평가 + 추천 제출 완료, P0_32).
 */
export function submitEvaluation(
  teamId: string,
  payload?: MentorEvaluationDraftPayload,
): MentorEvaluationMutationResult {
  const guarded = guardEvaluation(teamId)
  if ('ok' in guarded) return guarded
  const { team } = guarded
  if (payload)
    mentorDb.evaluationDrafts[teamId] = normalizeEvaluationPayload(
      team,
      payload,
    )
  const entries = evaluationEntriesOf(team)
  const missing = entries.filter((e) => !isCompleteEvaluationEntry(e)).length
  if (missing > 0)
    // 코드명은 명세 에러 22종 대조 전 추정(MENTOR_EVALUATION_* 계열) — BE 확정 시 정합 TODO.
    return evalError(
      422,
      'MENTOR_EVALUATION_REQUIRED_FIELD_MISSING',
      `팀원 전체 5축 점수와 줄글 평가 코멘트를 입력해 주세요 (${missing}명 미완료).`,
    )
  const stamp = nowStamp().replace('T', ' ')
  mentorDb.evaluations.push({
    teamId,
    writtenAtLabel: stamp.slice(0, 10),
    submittedAtLabel: stamp,
    byStudent: Object.fromEntries(
      entries.map((e) => [
        e.studentId,
        {
          axes: e.scores.map((s) => s!) as [
            number,
            number,
            number,
            number,
            number,
          ],
          comment: e.comment.trim(),
        },
      ]),
    ),
  })
  delete mentorDb.evaluationDrafts[teamId]
  return { ok: true, sheet: buildTeamEvaluationSheet(teamId)! }
}

function toEvaluationSubmission(
  evaluation: MentorMockEvaluation,
): MentorEvaluationSubmission | null {
  const team = mentorDb.teams.find((t) => t.teamId === evaluation.teamId)
  if (!team) return null
  const entries = Object.values(evaluation.byStudent)
  const submittedAtLabel =
    evaluation.submittedAtLabel ?? `${evaluation.writtenAtLabel} 00:00`
  const commentCount = entries.filter((e) => (e.comment ?? '').trim()).length
  return {
    teamId: team.teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    submittedAtLabel,
    targetCount: entries.length,
    axisAverages: EVALUATION_AXIS_LABELS.map((label, i) => ({
      label,
      value: avgOf(entries.map((e) => e.axes[i])),
    })),
    commentsLabel:
      commentCount === entries.length
        ? `${entries.length}명 모두 작성`
        : `${commentCount} / ${entries.length}명 작성`,
    editDeadlineLabel: plus24hLabel(submittedAtLabel),
  }
}

/**
 * GET /mentor/v1/evaluations — 제출 완료 페이지 요약(최신 제출 우선).
 * 명세 P0_35 에는 팀 단위 endpoint 만 정의 — 목록 read model 은 mock 보강(BE 확정 시 정합 TODO).
 */
export function buildEvaluationsData(): MentorEvaluationsData {
  return {
    submissions: mentorDb.evaluations
      .map(toEvaluationSubmission)
      .filter((s): s is MentorEvaluationSubmission => s != null)
      .sort((a, b) => b.submittedAtLabel.localeCompare(a.submittedAtLabel)),
  }
}
