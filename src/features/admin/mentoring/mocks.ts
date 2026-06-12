import { http, HttpResponse } from 'msw'
import {
  buildAdminLogDetail,
  buildAdminLogsData,
  buildAssignmentsData,
  changeAssignmentMentor,
  createAssignment,
  createLogChangeRequest,
  earlyEndAssignment,
  updateAllocatedHours,
  type AdminMentoringMutationResult,
} from './mockDb'
import type {
  MentorAssignmentCreateRequest,
  MentoringLogChangeRequestPayload,
} from './types'

// 운영 멘토링 mock — 기능 로컬. handlers.ts 의 import.meta.glob 자동 수집(export const handlers).
// 상태는 mockDb.ts 단일 소유 — mutation 이 상태를 실제로 바꿔 GET 에 즉시 반영된다.
// 401 응답 금지(가드 세션 초기화 유발). 경로는 P0_25_26 명세 그대로(prefix /api/admin).
const ok = <T>(data: T) => HttpResponse.json({ data })

/** mutation 결과 → HTTP 응답(실패 시 {code, message} + 상태 코드 — 401 금지). */
const respond = <T>(result: AdminMentoringMutationResult<T>) =>
  result.ok
    ? ok(result.data)
    : HttpResponse.json(
        { code: result.code, message: result.message },
        { status: result.status },
      )

const jsonOf = async <T>(request: Request) =>
  (await request.json().catch(() => undefined)) as T | undefined

export const handlers = [
  // ── 배정 (§29) ──
  http.get('/api/admin/mentors/assignments', () => ok(buildAssignmentsData())),
  http.post('/api/admin/mentors/assignments', async ({ request }) =>
    respond(
      createAssignment(
        (await jsonOf<Partial<MentorAssignmentCreateRequest>>(request)) ?? {},
      ),
    ),
  ),
  // 정적 하위 세그먼트(allocated-hours·early-end)를 :assignmentId 단독 PATCH 보다 먼저 배치.
  http.patch(
    '/api/admin/mentors/assignments/:assignmentId/allocated-hours',
    async ({ params, request }) => {
      const body = await jsonOf<{ allocatedHours?: number }>(request)
      return respond(
        updateAllocatedHours(String(params.assignmentId), body?.allocatedHours),
      )
    },
  ),
  http.post(
    '/api/admin/mentors/assignments/:assignmentId/early-end',
    async ({ params, request }) => {
      const body = await jsonOf<{ reason?: string }>(request)
      return respond(
        earlyEndAssignment(String(params.assignmentId), body?.reason),
      )
    },
  ),
  http.patch(
    '/api/admin/mentors/assignments/:assignmentId',
    async ({ params, request }) => {
      const body = await jsonOf<{ mentorId?: string }>(request)
      return respond(
        changeAssignmentMentor(String(params.assignmentId), body?.mentorId),
      )
    },
  ),

  // ── 일지 (§30) — 직접 수정·폐기·반려 endpoint 없음(05-31 확정) ──
  http.get('/api/admin/mentoring/logs', () => ok(buildAdminLogsData())),
  http.get('/api/admin/mentoring/logs/:logId', ({ params }) => {
    const detail = buildAdminLogDetail(String(params.logId))
    if (!detail) {
      return HttpResponse.json(
        {
          code: 'ADMIN_MENTORING_LOG_NOT_FOUND',
          message: '일지를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }
    return ok(detail)
  }),
  http.post(
    '/api/admin/mentoring/logs/:logId/change-requests',
    async ({ params, request }) =>
      respond(
        createLogChangeRequest(
          String(params.logId),
          await jsonOf<Partial<MentoringLogChangeRequestPayload>>(request),
        ),
      ),
  ),
]
