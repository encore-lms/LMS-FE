import { http, HttpResponse } from 'msw'
import {
  buildDashboardData,
  buildEvaluationsData,
  buildLogFieldSnapshot,
  buildMenteeDetail,
  buildMentoringLogDetail,
  buildMentoringLogTargets,
  buildMentoringLogsData,
  buildMentoringRequestDetail,
  buildMentoringRequestsData,
  buildRecommendationsData,
  buildTeamDetailData,
  buildTeamEvaluationSheet,
  buildTeamRecommendationSheet,
  buildTeamsData,
  respondToMentoringRequest,
  saveEvaluationDraft,
  saveMentoringLogDraft,
  saveRecommendationDraft,
  submitEvaluation,
  submitMentoringLog,
  submitRecommendation,
  updateConfirmedDetails,
  updateMentoringLogDraft,
  type MentorEvaluationMutationResult,
  type MentorRecommendationMutationResult,
  type MentoringLogMutationResult,
  type MentoringRequestMockAction,
  type MentoringRequestMutationResult,
} from './mockDb'
import type {
  MentorEvaluationDraftPayload,
  MentorRecommendationDraftPayload,
  MentoringLogDraftPayload,
  MentoringRequestActionPayload,
} from './types'

// 멘토 콘솔 mock — 기능 로컬. handlers.ts 의 import.meta.glob 자동 수집(export const handlers).
// 상태는 mockDb.ts 단일 모듈 소유 — 이후 멘토 PR(예약 응답·일지 제출·평가 등)의 mutation
// 핸들러가 같은 상태를 변경해 아래 GET 3종에 즉시 반영된다. 401 응답 금지(가드 세션 초기화 유발).
const ok = <T>(data: T) => HttpResponse.json({ data })

/** mutation 결과 → HTTP 응답(실패 시 {code, message} + 상태 코드 — 401 금지). */
const respond = (result: MentoringRequestMutationResult) =>
  result.ok
    ? ok(result.request)
    : HttpResponse.json(
        { code: result.code, message: result.message },
        { status: result.status },
      )

/** 일지 mutation 결과 → HTTP 응답 — respond 와 동일 규약(401 금지). */
const respondLog = (result: MentoringLogMutationResult) =>
  result.ok
    ? ok(result.log)
    : HttpResponse.json(
        { code: result.code, message: result.message },
        { status: result.status },
      )

/** 평가 mutation 결과 → HTTP 응답 — respond 와 동일 규약(401 금지). */
const respondEvaluation = (result: MentorEvaluationMutationResult) =>
  result.ok
    ? ok(result.sheet)
    : HttpResponse.json(
        { code: result.code, message: result.message },
        { status: result.status },
      )

/** 추천 mutation 결과 → HTTP 응답 — respond 와 동일 규약(401 금지). */
const respondRecommendation = (result: MentorRecommendationMutationResult) =>
  result.ok
    ? ok(result.sheet)
    : HttpResponse.json(
        { code: result.code, message: result.message },
        { status: result.status },
      )

const logPayloadOf = async (request: Request) =>
  (await request.json().catch(() => undefined)) as
    | MentoringLogDraftPayload
    | undefined

// 멘토 응답 3종 + 확정 취소 — 명세 세그먼트 그대로(POST {confirm|reject|counter-propose|cancel}).
const requestAction = (action: MentoringRequestMockAction) =>
  http.post(
    `/api/mentor/v1/mentoring-requests/:requestId/${action}`,
    async ({ params, request }) => {
      const payload = (await request.json().catch(() => undefined)) as
        | MentoringRequestActionPayload
        | undefined
      return respond(
        respondToMentoringRequest(String(params.requestId), action, payload),
      )
    },
  )

export const handlers = [
  http.get('/api/mentor/v1/dashboard', () => ok(buildDashboardData())),
  http.get('/api/mentor/v1/teams', () => ok(buildTeamsData())),
  http.get('/api/mentor/v1/teams/:teamId', ({ params }) => {
    const detail = buildTeamDetailData(String(params.teamId))
    if (!detail) {
      // 본인 배정 팀이 아닌 직접 URL 진입 차단(P0-MTR-DASH-001) — mock은 미존재와 동일 처리.
      return HttpResponse.json(
        {
          code: 'MENTOR_SCOPE_FORBIDDEN',
          message: '본인에게 배정된 팀이 아닙니다.',
        },
        { status: 403 },
      )
    }
    return ok(detail)
  }),
  http.get('/api/mentor/v1/mentoring-requests', () =>
    ok(buildMentoringRequestsData()),
  ),
  http.get('/api/mentor/v1/mentoring-requests/:requestId', ({ params }) => {
    const detail = buildMentoringRequestDetail(String(params.requestId))
    if (!detail) {
      return HttpResponse.json(
        {
          code: 'MENTOR_RESERVATION_NOT_FOUND',
          message: '예약 요청을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }
    return ok(detail)
  }),
  requestAction('confirm'),
  requestAction('reject'),
  requestAction('counter-propose'),
  requestAction('cancel'),
  http.patch(
    '/api/mentor/v1/mentoring-requests/:requestId/confirmed-details',
    async ({ params, request }) => {
      const payload = (await request.json().catch(() => ({}))) as
        | MentoringRequestActionPayload
        | undefined
      return respond(
        updateConfirmedDetails(String(params.requestId), payload ?? {}),
      )
    },
  ),

  // ── 멘토링 일지 (M3) — 정적 세그먼트(targets·draft)를 :logId 보다 앞에 등록 ──
  http.get('/api/mentor/v1/mentoring-logs/targets', () =>
    ok(buildMentoringLogTargets()),
  ),
  http.get('/api/mentor/v1/mentoring-logs', () => ok(buildMentoringLogsData())),
  http.get('/api/mentor/v1/mentoring-logs/:logId', ({ params }) => {
    const detail = buildMentoringLogDetail(String(params.logId))
    if (!detail) {
      return HttpResponse.json(
        { code: 'MENTOR_LOG_NOT_FOUND', message: '일지를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }
    return ok(detail)
  }),
  http.get('/api/mentor/v1/teams/:teamId/log-field-snapshot', ({ params }) => {
    const fields = buildLogFieldSnapshot(String(params.teamId))
    if (!fields) {
      return HttpResponse.json(
        {
          code: 'MENTOR_SCOPE_FORBIDDEN',
          message: '본인에게 배정된 팀이 아닙니다.',
        },
        { status: 403 },
      )
    }
    return ok(fields)
  }),
  // 초안 저장 — 신규(PUT /draft)·갱신(PUT /:logId/draft). 인정 시간 미반영(DRAFT).
  http.put('/api/mentor/v1/mentoring-logs/draft', async ({ request }) => {
    const payload = await logPayloadOf(request)
    return respondLog(saveMentoringLogDraft(payload ?? { teamId: '' }))
  }),
  http.put(
    '/api/mentor/v1/mentoring-logs/:logId/draft',
    async ({ params, request }) => {
      const payload = await logPayloadOf(request)
      return respondLog(
        updateMentoringLogDraft(
          String(params.logId),
          payload ?? { teamId: '' },
        ),
      )
    },
  ),
  // 제출·재제출 — 즉시 자동 유효, 인정 시간 재계산이 M1 팀 누적 상태에 반영(상태형 mock).
  http.post(
    '/api/mentor/v1/mentoring-logs/:logId/submit',
    async ({ params, request }) =>
      respondLog(
        submitMentoringLog(
          String(params.logId),
          'submit',
          await logPayloadOf(request),
        ),
      ),
  ),
  http.post(
    '/api/mentor/v1/mentoring-logs/:logId/resubmit',
    async ({ params, request }) =>
      respondLog(
        submitMentoringLog(
          String(params.logId),
          'resubmit',
          await logPayloadOf(request),
        ),
      ),
  ),

  // ── 학생 상세 (M3) — 배정 팀 팀원 한정 조회(미배정 403, P0-MTR-DASH-001 준용) ──
  http.get('/api/mentor/v1/mentees/:studentId', ({ params }) => {
    const detail = buildMenteeDetail(String(params.studentId))
    if (!detail) {
      return HttpResponse.json(
        {
          code: 'MENTOR_SCOPE_FORBIDDEN',
          message: '배정 팀의 팀원만 조회할 수 있습니다.',
        },
        { status: 403 },
      )
    }
    return ok(detail)
  }),

  // ── 평가 · 추천 (M4) — GET/PUT(draft)/POST(submit) /teams/{teamId}/{evaluation|recommendation}* ──
  http.get('/api/mentor/v1/teams/:teamId/evaluation', ({ params }) => {
    const sheet = buildTeamEvaluationSheet(String(params.teamId))
    if (!sheet) {
      return HttpResponse.json(
        {
          code: 'MENTOR_SCOPE_FORBIDDEN',
          message: '본인에게 배정된 팀이 아닙니다.',
        },
        { status: 403 },
      )
    }
    return ok(sheet)
  }),
  http.put(
    '/api/mentor/v1/teams/:teamId/evaluation/draft',
    async ({ params, request }) => {
      const payload = (await request.json().catch(() => undefined)) as
        | MentorEvaluationDraftPayload
        | undefined
      return respondEvaluation(
        saveEvaluationDraft(String(params.teamId), payload ?? { entries: [] }),
      )
    },
  ),
  http.post(
    '/api/mentor/v1/teams/:teamId/evaluation/submit',
    async ({ params, request }) => {
      const payload = (await request.json().catch(() => undefined)) as
        | MentorEvaluationDraftPayload
        | undefined
      return respondEvaluation(submitEvaluation(String(params.teamId), payload))
    },
  ),
  http.get('/api/mentor/v1/teams/:teamId/recommendation', ({ params }) => {
    const sheet = buildTeamRecommendationSheet(String(params.teamId))
    if (!sheet) {
      return HttpResponse.json(
        {
          code: 'MENTOR_SCOPE_FORBIDDEN',
          message: '본인에게 배정된 팀이 아닙니다.',
        },
        { status: 403 },
      )
    }
    return ok(sheet)
  }),
  http.put(
    '/api/mentor/v1/teams/:teamId/recommendation/draft',
    async ({ params, request }) => {
      const payload = (await request.json().catch(() => undefined)) as
        | MentorRecommendationDraftPayload
        | undefined
      return respondRecommendation(
        saveRecommendationDraft(
          String(params.teamId),
          payload ?? { mode: null, studentId: null, summary: '', notify: true },
        ),
      )
    },
  ),
  http.post(
    '/api/mentor/v1/teams/:teamId/recommendation/submit',
    async ({ params, request }) => {
      const payload = (await request.json().catch(() => undefined)) as
        | MentorRecommendationDraftPayload
        | undefined
      return respondRecommendation(
        submitRecommendation(String(params.teamId), payload),
      )
    },
  ),
  // 제출 완료 페이지 요약 — 명세 P0_35 는 팀 단위 endpoint 만 정의(목록은 mock 보강 read model).
  http.get('/api/mentor/v1/evaluations', () => ok(buildEvaluationsData())),
  http.get('/api/mentor/v1/recommendations', () =>
    ok(buildRecommendationsData()),
  ),
]
