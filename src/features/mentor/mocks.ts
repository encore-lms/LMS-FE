import { http, HttpResponse } from 'msw'
import {
  buildDashboardData,
  buildMentoringRequestDetail,
  buildMentoringRequestsData,
  buildTeamDetailData,
  buildTeamsData,
  respondToMentoringRequest,
  updateConfirmedDetails,
  type MentoringRequestMockAction,
  type MentoringRequestMutationResult,
} from './mockDb'
import type { MentoringRequestActionPayload } from './types'

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
]
