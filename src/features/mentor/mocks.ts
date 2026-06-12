import { http, HttpResponse } from 'msw'
import {
  buildDashboardData,
  buildTeamDetailData,
  buildTeamsData,
} from './mockDb'

// 멘토 콘솔 mock — 기능 로컬. handlers.ts 의 import.meta.glob 자동 수집(export const handlers).
// 상태는 mockDb.ts 단일 모듈 소유 — 이후 멘토 PR(예약 응답·일지 제출·평가 등)의 mutation
// 핸들러가 같은 상태를 변경해 아래 GET 3종에 즉시 반영된다. 401 응답 금지(가드 세션 초기화 유발).
const ok = <T>(data: T) => HttpResponse.json({ data })

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
]
