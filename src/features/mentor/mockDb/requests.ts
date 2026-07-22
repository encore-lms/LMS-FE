// 멘토 mock — 멘토링 예약 요청 목록·상세·멘토 응답 mutation(M2).
import type {
  MentoringRequestActionPayload,
  MentoringRequestItem,
  MentoringRequestSlot,
  MentoringRequestsData,
} from '../types'
import { MENTORING_PLACE_TYPE_LABEL } from '../types'
import { mentorDb } from './db'
import type {
  MentorMockRequest,
  MentorMockReservation,
  MentorMockSlot,
} from './db'
import {
  DOW_LABELS,
  dateLabelOf,
  endTimeLabelOf,
  nowStamp,
  placeTypeOfLabel,
  timeLabelOf,
} from './shared'
// ───────────────────────── 멘토링 예약 (M2) ─────────────────────────

/** mock 슬롯 → read model 슬롯(정렬 메타 startsAt 등 mock 전용 필드 제거) */
function stripSlot(slot: MentorMockSlot): MentoringRequestSlot {
  return {
    dateTimeLabel: slot.dateTimeLabel,
    placeType: slot.placeType,
    placeDetail: slot.placeDetail,
    expectedMinutes: slot.expectedMinutes,
    memo: slot.memo,
  }
}

function toRequestItem(req: MentorMockRequest): MentoringRequestItem {
  const team = mentorDb.teams.find((t) => t.teamId === req.teamId)
  return {
    requestId: req.requestId,
    teamId: req.teamId,
    cohortLabel: team?.cohortLabel ?? '',
    teamName: team?.teamName ?? '',
    status: req.status,
    dDayLabel: req.dDayLabel,
    requestedAtLabel: req.requestedAtLabel,
    requester: { name: req.requesterName, role: req.requesterRole },
    desired: stripSlot(req.desired),
    proposal: req.proposal && stripSlot(req.proposal),
    confirmed: req.confirmed && stripSlot(req.confirmed),
    mentorResponseNote: req.mentorResponseNote,
    activityAt: req.activityAt,
  }
}

/**
 * 완료 예약 — 별도 저장 없이 유효 일지에서 파생(일지 제출 시 예약 COMPLETED 동기화 계약 재현,
 * M3 일지 제출 PR과 자연 연동). 요청자·요청 메모는 일지에 보존되지 않아 PM 대표로 대체(mock 한정).
 * Figma 더미 '완료 12'와는 건수 드리프트(유효 일지 14건) — M1 상태 공유를 우선한다.
 */
function deriveCompletedRequests(): MentoringRequestItem[] {
  return mentorDb.teams.flatMap((team) => {
    const pm = team.members.find((m) => m.role === 'pm') ?? team.members[0]
    return team.logs
      .filter((log) => log.status === 'valid')
      .map((log): MentoringRequestItem => {
        const [typeLabel, detail = ''] = log.locationLabel.split(' · ')
        const dow = DOW_LABELS[new Date(log.performedAt).getDay()]
        const slot: MentoringRequestSlot = {
          dateTimeLabel: `${dateLabelOf(log.performedAt)}(${dow}) ${timeLabelOf(log.performedAt)} ~ ${endTimeLabelOf(log.performedAt, log.actualMinutes)}`,
          placeType: placeTypeOfLabel(typeLabel),
          placeDetail: detail,
          expectedMinutes: log.actualMinutes,
        }
        return {
          requestId: `req_${log.logId}`,
          teamId: team.teamId,
          cohortLabel: team.cohortLabel,
          teamName: team.teamName,
          status: 'completed',
          dDayLabel: null,
          requestedAtLabel: `${log.performedAt.slice(0, 10)} ${timeLabelOf(log.performedAt)}`,
          requester: { name: pm?.name ?? '', role: pm?.role ?? 'pm' },
          desired: slot,
          proposal: null,
          confirmed: slot,
          activityAt: log.performedAt,
        }
      })
  })
}

/**
 * GET /mentor/v1/mentoring-requests 응답 빌더.
 * 정렬: 진행 중(요청 대기·조정 제안, Figma 카드 순) → 확정(임박순) → 거절·취소 → 완료(최신순).
 */
export function buildMentoringRequestsData(): MentoringRequestsData {
  const stored = mentorDb.requests.map(toRequestItem)
  const open = stored.filter(
    (r) => r.status === 'requested' || r.status === 'counter_proposed',
  )
  const confirmed = stored
    .filter((r) => r.status === 'confirmed')
    .sort((a, b) => a.activityAt.localeCompare(b.activityAt))
  const closed = stored
    .filter((r) => r.status === 'rejected' || r.status === 'canceled')
    .sort((a, b) => b.activityAt.localeCompare(a.activityAt))
  const completed = deriveCompletedRequests().sort((a, b) =>
    b.activityAt.localeCompare(a.activityAt),
  )
  return { requests: [...open, ...confirmed, ...closed, ...completed] }
}

/** GET /mentor/v1/mentoring-requests/{reservationId} — 미존재 시 null(404 처리). */
export function buildMentoringRequestDetail(
  requestId: string,
): MentoringRequestItem | null {
  return (
    buildMentoringRequestsData().requests.find(
      (r) => r.requestId === requestId,
    ) ?? null
  )
}

export type MentoringRequestMockAction =
  | 'confirm'
  | 'reject'
  | 'counter-propose'
  | 'cancel'

export type MentoringRequestMutationResult =
  | { ok: true; request: MentoringRequestItem }
  | { ok: false; status: number; code: string; message: string }

const mockError = (
  status: number,
  code: string,
  message: string,
): MentoringRequestMutationResult => ({ ok: false, status, code, message })

// 코드명은 MENTOR_RESERVATION_REQUIRED_FIELD_MISSING(명세 확정) 외 추정 — 명세 에러 22종 대조 TODO.
const invalidTransition = (message: string) =>
  mockError(409, 'MENTOR_RESERVATION_INVALID_TRANSITION', message)

/** 확정·조정·변경 공통 필수 필드 — 일정 + 예상 시간 + 장소(422, P0-MTR-RES). */
const slotComplete = (p?: MentoringRequestActionPayload) =>
  !!p?.dateTimeLabel?.trim() &&
  !!p.placeType &&
  !!p.placeDetail?.trim() &&
  typeof p.expectedMinutes === 'number' &&
  p.expectedMinutes > 0

function toNextReservation(
  req: MentorMockRequest,
  slot: MentorMockSlot,
): MentorMockReservation {
  return {
    reservationId: req.requestId,
    startsAt: slot.startsAt,
    dayOfWeekLabel: slot.dayOfWeekLabel,
    locationTypeLabel: MENTORING_PLACE_TYPE_LABEL[slot.placeType],
    locationDetailLabel: slot.placeDetail,
    expectedMinutes: slot.expectedMinutes,
    requesterName: req.requesterName,
    // 가장 임박 건 D-day 부여 규칙 BE 확정 대기 — 신규 확정 건은 미표시
    dDayLabel: null,
  }
}

/** payload(자유 텍스트 일정) → mock 슬롯. 정렬 메타는 base 슬롯에서 승계(BE ISO 확정 시 제거 TODO). */
function payloadToSlot(
  payload: MentoringRequestActionPayload,
  base: MentorMockSlot,
): MentorMockSlot {
  return {
    dateTimeLabel: payload.dateTimeLabel!.trim(),
    placeType: payload.placeType!,
    placeDetail: payload.placeDetail!.trim(),
    expectedMinutes: payload.expectedMinutes!,
    startsAt: base.startsAt,
    dayOfWeekLabel: base.dayOfWeekLabel,
  }
}

/**
 * 멘토 예약 응답 — POST /mentoring-requests/{id}/{confirm|reject|counter-propose|cancel}.
 * 상태 전이(mentoring.md): REQUESTED→(멘토)CONFIRMED/REJECTED/COUNTER_PROPOSED.
 * 응답 결과는 M1 화면 상태(팀 reservationSummary·nextConfirmed)에 즉시 반영(상태형 mock).
 * 역할 교차(수강생 화면 mocks) 반영은 BE 계약 확정 시 — student/mentoring mock 은 무접촉.
 */
export function respondToMentoringRequest(
  requestId: string,
  action: MentoringRequestMockAction,
  payload?: MentoringRequestActionPayload,
): MentoringRequestMutationResult {
  const req = mentorDb.requests.find((r) => r.requestId === requestId)
  if (!req)
    return mockError(
      404,
      'MENTOR_RESERVATION_NOT_FOUND',
      '예약 요청을 찾을 수 없습니다.',
    )
  const team = mentorDb.teams.find((t) => t.teamId === req.teamId)

  switch (action) {
    case 'confirm': {
      // COUNTER_PROPOSED 의 확정은 수강생 몫(재조정 제안 없음) — 멘토 확정은 REQUESTED 에서만.
      if (req.status !== 'requested')
        return invalidTransition('요청 대기 상태에서만 확정할 수 있습니다.')
      req.status = 'confirmed'
      req.confirmed = { ...req.desired } // 희망 일정 그대로
      req.activityAt = nowStamp()
      if (team) {
        team.reservationSummary.inProgress = Math.max(
          0,
          team.reservationSummary.inProgress - 1,
        )
        team.reservationSummary.confirmed += 1
        const next = toNextReservation(req, req.confirmed)
        if (!team.nextConfirmed || next.startsAt < team.nextConfirmed.startsAt)
          team.nextConfirmed = next
      }
      return { ok: true, request: toRequestItem(req) }
    }
    case 'reject': {
      if (req.status !== 'requested')
        return invalidTransition('요청 대기 상태에서만 거절할 수 있습니다.')
      req.status = 'rejected'
      // 거절 응답 메모는 선택 — 필수/선택 정책 미확정(P0-MTR-RES-005) TODO.
      req.mentorResponseNote = payload?.mentorResponseNote?.trim() || undefined
      req.activityAt = nowStamp()
      if (team)
        team.reservationSummary.inProgress = Math.max(
          0,
          team.reservationSummary.inProgress - 1,
        )
      return { ok: true, request: toRequestItem(req) }
    }
    case 'counter-propose': {
      // REQUESTED→COUNTER_PROPOSED + '제안 수정'(본인 제안 갱신 — 전이표 외 보강, BE 확정 대기 TODO)
      if (req.status !== 'requested' && req.status !== 'counter_proposed')
        return invalidTransition('진행 중 요청에만 조정 제안할 수 있습니다.')
      if (!slotComplete(payload))
        return mockError(
          422,
          'MENTOR_RESERVATION_REQUIRED_FIELD_MISSING',
          '일정·예상 시간·장소는 필수입니다.',
        )
      req.status = 'counter_proposed'
      req.proposal = payloadToSlot(payload!, req.desired)
      req.mentorResponseNote = payload?.mentorResponseNote?.trim() || undefined
      req.activityAt = nowStamp()
      return { ok: true, request: toRequestItem(req) }
    }
    case 'cancel': {
      // 명세상 cancel 은 확정 예약 취소(CONFIRMED→CANCELED) 전용. Figma '제안 취소'의
      // 제안 철회 전이는 명세 부재 — mock 한정으로 cancel 을 재사용해 REQUESTED 복귀(BE 확정 시 정합 TODO).
      if (req.status === 'counter_proposed') {
        req.status = 'requested'
        req.proposal = null
        req.mentorResponseNote = undefined
        req.activityAt = nowStamp()
        return { ok: true, request: toRequestItem(req) }
      }
      if (req.status === 'confirmed') {
        req.status = 'canceled'
        req.confirmed = null
        req.activityAt = nowStamp()
        if (team) {
          team.reservationSummary.confirmed = Math.max(
            0,
            team.reservationSummary.confirmed - 1,
          )
          if (team.nextConfirmed?.reservationId === req.requestId) {
            const rest = mentorDb.requests
              .filter(
                (r) =>
                  r.teamId === req.teamId &&
                  r.status === 'confirmed' &&
                  r.confirmed,
              )
              .sort((a, b) =>
                a.confirmed!.startsAt.localeCompare(b.confirmed!.startsAt),
              )
            team.nextConfirmed = rest.length
              ? toNextReservation(rest[0], rest[0].confirmed!)
              : null
          }
        }
        return { ok: true, request: toRequestItem(req) }
      }
      return invalidTransition('취소할 수 없는 상태입니다.')
    }
  }
}

/**
 * 확정 예약 일정·장소 변경 — PATCH /mentoring-requests/{id}/confirmed-details.
 * 확정 후 변경은 멘토만 가능(05-26 정책). 일정 라벨이 자유 텍스트라 대시보드 날짜 칸의
 * 정렬 메타(startsAt)는 유지 — BE ISO 계약 확정 시 정규화 TODO.
 */
export function updateConfirmedDetails(
  requestId: string,
  payload: MentoringRequestActionPayload,
): MentoringRequestMutationResult {
  const req = mentorDb.requests.find((r) => r.requestId === requestId)
  if (!req)
    return mockError(
      404,
      'MENTOR_RESERVATION_NOT_FOUND',
      '예약 요청을 찾을 수 없습니다.',
    )
  if (req.status !== 'confirmed' || !req.confirmed)
    return invalidTransition('확정 상태에서만 변경할 수 있습니다.')
  if (!slotComplete(payload))
    return mockError(
      422,
      'MENTOR_RESERVATION_REQUIRED_FIELD_MISSING',
      '일정·예상 시간·장소는 필수입니다.',
    )
  req.confirmed = payloadToSlot(payload, req.confirmed)
  if (payload.mentorResponseNote !== undefined)
    req.mentorResponseNote = payload.mentorResponseNote.trim() || undefined
  req.activityAt = nowStamp()
  const team = mentorDb.teams.find((t) => t.teamId === req.teamId)
  if (team?.nextConfirmed?.reservationId === req.requestId)
    team.nextConfirmed = {
      ...team.nextConfirmed,
      locationTypeLabel: MENTORING_PLACE_TYPE_LABEL[req.confirmed.placeType],
      locationDetailLabel: req.confirmed.placeDetail,
      expectedMinutes: req.confirmed.expectedMinutes,
    }
  return { ok: true, request: toRequestItem(req) }
}
