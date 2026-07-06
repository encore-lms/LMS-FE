import { http, HttpResponse } from 'msw'
import {
  buildMenteeDetail,
  buildMentoringRequestDetail,
  buildMentoringRequestsData,
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
  // 대시보드·팀 목록·팀 상세는 실 BE(auth-user-service) 연동 — MentorConsoleController.
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

  // ── 멘토링 일지 (M3) — 목록·상세·대상·스냅샷·제출·재제출은 실 BE(auth-user-service) 연동.
  //    초안(임시 저장)은 승인 단계 도입으로 제거 — BE는 제출 시에만 일지를 생성한다.

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

  // ── 평가·추천(M4)은 실 BE(auth-user-service /mentor/v1/*) 연동 — mock 제거.
]
