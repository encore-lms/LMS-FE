// 멘토 mock — 팀 추천 시트·초안·제출 mutation(M4, 평가 제출 후 잠금 해제).
import type {
  EvaluationScoreTuple,
  MentorRecommendationCandidate,
  MentorRecommendationDraftPayload,
  MentorRecommendationSheetData,
  MentorRecommendationStatus,
  MentorRecommendationSubmission,
  MentorRecommendationsData,
} from '../types'
import { mentorDb } from './db'
import type { MentorMockRecommendation, MentorMockTeam } from './db'
import { EMPTY_SCORES, avgOf } from './evaluations'
import { nowStamp } from './shared'

/** GET /mentor/v1/teams/{teamId}/recommendation — 미배정 팀이면 null(403 처리). */
export function buildTeamRecommendationSheet(
  teamId: string,
): MentorRecommendationSheetData | null {
  const team = mentorDb.teams.find((t) => t.teamId === teamId)
  if (!team) return null
  const evaluation = mentorDb.evaluations.find((e) => e.teamId === teamId)
  const submitted = mentorDb.recommendations.find((r) => r.teamId === teamId)
  const draft = mentorDb.recommendationDrafts[teamId]
  const candidates: MentorRecommendationCandidate[] = team.members.map(
    (member) => {
      const sub = evaluation?.byStudent[member.studentId]
      return {
        ...member,
        average: sub ? avgOf(sub.axes) : null,
        scores: sub
          ? ([...sub.axes] as EvaluationScoreTuple)
          : ([...EMPTY_SCORES] as EvaluationScoreTuple),
      }
    },
  )
  // 정책 완화(2026-08-04) — 평가 선행 게이트 폐기, locked_until_evaluation 미발생(BE 계약 정합).
  const status: MentorRecommendationStatus = submitted
    ? submitted.studentId
      ? 'submitted_recommended'
      : 'submitted_not_recommended'
    : draft
      ? 'draft'
      : 'not_started'
  return {
    teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    memberCount: team.members.length,
    status,
    teamAverage: evaluation
      ? avgOf(
          candidates
            .map((c) => c.average)
            .filter((a): a is number => a != null),
        )
      : null,
    candidates,
    draft: submitted
      ? {
          mode: submitted.studentId ? 'recommend' : 'none',
          studentId: submitted.studentId,
          summary: submitted.reason,
          notify: submitted.notify ?? true,
        }
      : (draft ?? { mode: null, studentId: null, summary: '', notify: true }),
    submittedAtLabel: submitted?.submittedAtLabel ?? null,
  }
}

export type MentorRecommendationMutationResult =
  | { ok: true; sheet: MentorRecommendationSheetData }
  | { ok: false; status: number; code: string; message: string }

const recError = (
  status: number,
  code: string,
  message: string,
): MentorRecommendationMutationResult => ({ ok: false, status, code, message })

/** 팀 스코프 guard — 미배정 403(정책 완화로 평가 선행 422 게이트는 폐기). */
function guardRecommendation(
  teamId: string,
): { team: MentorMockTeam } | MentorRecommendationMutationResult {
  const team = mentorDb.teams.find((t) => t.teamId === teamId)
  if (!team)
    return recError(
      403,
      'MENTOR_SCOPE_FORBIDDEN',
      '본인에게 배정된 팀이 아닙니다.',
    )
  return { team }
}

/**
 * PUT /mentor/v1/teams/{teamId}/recommendation/draft — 자동/임시 저장.
 * 제출본의 draft 덮어쓰기는 409 — 수정은 재제출로만(BE 규약 정합).
 */
export function saveRecommendationDraft(
  teamId: string,
  payload: MentorRecommendationDraftPayload,
): MentorRecommendationMutationResult {
  const guarded = guardRecommendation(teamId)
  if ('ok' in guarded) return guarded
  if (mentorDb.recommendations.some((r) => r.teamId === teamId))
    return recError(
      409,
      'MENTOR_RECOMMENDATION_ALREADY_SUBMITTED',
      '제출된 추천은 재제출로만 수정할 수 있습니다.',
    )
  mentorDb.recommendationDrafts[teamId] = {
    mode: payload.mode,
    studentId: payload.mode === 'none' ? null : payload.studentId,
    summary: (payload.summary ?? '').slice(0, 500),
    notify: payload.notify ?? true,
  }
  return { ok: true, sheet: buildTeamRecommendationSheet(teamId)! }
}

/**
 * POST /mentor/v1/teams/{teamId}/recommendation/submit — 제출·재제출(팀당 1건 unique,
 * 상시 수정 — 마지막 제출본 유효). recommended → 대상 1명 + certificateSummary 필수,
 * not_recommended → 대상 null · 사유 입력 없음.
 * 추천 제출 = 활동 인정 요건 충족 — 평가 필요 팀은 completed 로 전이(조기 종료 팀은 유지).
 */
export function submitRecommendation(
  teamId: string,
  payload?: MentorRecommendationDraftPayload,
): MentorRecommendationMutationResult {
  const guarded = guardRecommendation(teamId)
  if ('ok' in guarded) return guarded
  const { team } = guarded
  const input = payload ?? mentorDb.recommendationDrafts[teamId]
  if (!input?.mode)
    // 코드명은 명세 에러 22종 대조 전 추정(MENTOR_RECOMMENDATION_* 계열) — BE 확정 시 정합 TODO.
    return recError(
      422,
      'MENTOR_RECOMMENDATION_MODE_REQUIRED',
      '팀원 1명 추천 또는 추천하지 않음 중 하나를 선택해 주세요.',
    )
  const summary = (input.summary ?? '').trim()
  if (input.mode === 'recommend') {
    if (
      !input.studentId ||
      !team.members.some((m) => m.studentId === input.studentId)
    )
      return recError(
        422,
        'MENTOR_RECOMMENDATION_TARGET_REQUIRED',
        '추천할 팀원을 선택해 주세요 (팀당 1명).',
      )
    if (!summary)
      return recError(
        422,
        'MENTOR_RECOMMENDATION_SUMMARY_REQUIRED',
        '추천 대상자는 증명서용 간략 요약이 있어야 합니다.',
      )
    if (summary.length > 500)
      return recError(
        422,
        'MENTOR_RECOMMENDATION_SUMMARY_LENGTH_EXCEEDED',
        '증명서용 간략 요약은 500자 이내로 작성해 주세요.',
      )
  }
  // 재제출 — 기존 제출본 교체(마지막 제출본 유효).
  const prevIndex = mentorDb.recommendations.findIndex(
    (r) => r.teamId === teamId,
  )
  if (prevIndex >= 0) mentorDb.recommendations.splice(prevIndex, 1)
  mentorDb.recommendations.push({
    teamId,
    studentId: input.mode === 'recommend' ? input.studentId : null,
    submittedAtLabel: nowStamp().replace('T', ' '),
    reason: input.mode === 'recommend' ? summary : '',
    notify: input.notify ?? true,
  })
  delete mentorDb.recommendationDrafts[teamId]
  if (team.status === 'evaluation_needed') team.status = 'completed'
  return { ok: true, sheet: buildTeamRecommendationSheet(teamId)! }
}

function toRecommendationSubmission(
  rec: MentorMockRecommendation,
): MentorRecommendationSubmission | null {
  const team = mentorDb.teams.find((t) => t.teamId === rec.teamId)
  if (!team) return null
  const member = rec.studentId
    ? team.members.find((m) => m.studentId === rec.studentId)
    : undefined
  return {
    teamId: team.teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    submittedAtLabel: rec.submittedAtLabel,
    recommended: !!member,
    targetLabel: member
      ? `${member.name} (${member.tagLabel ?? (member.role === 'pm' ? 'PM' : '팀원')})`
      : '추천하지 않음',
    summaryLabel: member
      ? `${rec.reason.length}자 · 필수 충족`
      : '입력 없음 · 추천하지 않음',
    certificateLabel: '증명서 전체 공개 + 인증 완료 + 최신화 스냅샷 기준',
    // 정책 완화(2026-08-04) — 24h 마감 폐기(BE 계약 정합).
    editDeadlineLabel: '상시 수정 가능',
  }
}

/** GET /mentor/v1/recommendations — 제출 완료 페이지 요약(최신 제출 우선, mock 보강 read model). */
export function buildRecommendationsData(): MentorRecommendationsData {
  return {
    submissions: mentorDb.recommendations
      .map(toRecommendationSubmission)
      .filter((s): s is MentorRecommendationSubmission => s != null)
      .sort((a, b) => b.submittedAtLabel.localeCompare(a.submittedAtLabel)),
  }
}
