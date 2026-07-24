import type { RequestHandler } from 'msw'

// 변경 제안·재인증은 learning-service 실 BE로 전환(ISSUE 3+4, BE #287/#288).
// MSW 핸들러를 비워 /api/instructor/change-requests·recertifications 가 vite proxy → 실 BE 로 간다.
// (배포 dev도 mock 우회 → 실 BE. 로컬은 vite.config proxy 경로로 전달.)
export const handlers: RequestHandler[] = []
