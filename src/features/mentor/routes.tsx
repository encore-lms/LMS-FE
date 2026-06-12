import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 멘토 라우트 — features/mentor 소유자만 편집. MENTOR 가드는 src/app/router.tsx 에 기배선.
// canonical 경로 = Figma · P0_32_35 API 명세(/mentor/dashboard · teams · mentoring-requests
// · mentoring-logs · evaluations · recommendations).
const DashboardPage = lazy(() => import('./dashboard/DashboardPage'))
const TeamsPage = lazy(() => import('./teams/TeamsPage'))
const TeamDetailPage = lazy(() => import('./teams/TeamDetailPage'))
const RequestsPage = lazy(() => import('./requests/RequestsPage'))
const RequestResponseModal = lazy(
  () => import('./requests/RequestResponseModal'),
)
// 폴더명은 mentoring-logs — 루트 .gitignore 의 'logs' 패턴(빌드 로그용)과 충돌 회피.
const LogsPage = lazy(() => import('./mentoring-logs/LogsPage'))
const LogDetailModal = lazy(() => import('./mentoring-logs/LogDetailModal'))
const LogComposePage = lazy(() => import('./mentoring-logs/LogComposePage'))
const MenteeDetailPage = lazy(() => import('./mentees/MenteeDetailPage'))

export const mentorRoutes: RouteObject[] = [
  {
    path: 'mentor',
    children: [
      // 대시보드 — index(/mentor)와 /mentor/dashboard 는 같은 화면(별칭, Figma 경로 표기 기준)
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'teams', element: <TeamsPage /> },
      { path: 'teams/:teamId', element: <TeamDetailPage /> },
      {
        path: 'mentoring-requests',
        element: <RequestsPage />,
        // URL 라우팅 모달 — 목록 위 오버레이(중첩 라우트, 목록 탭·검색 상태 유지)
        children: [{ path: ':requestId', element: <RequestResponseModal /> }],
      },
      // 일지 작성/수정 — 정적 'new' 를 동적 :logId 보다 앞에(admin routes 주석 컨벤션)
      { path: 'mentoring-logs/new', element: <LogComposePage /> },
      {
        path: 'mentoring-logs',
        element: <LogsPage />,
        // URL 라우팅 상세 모달 — 목록 위 오버레이(필터 상태 유지)
        children: [{ path: ':logId', element: <LogDetailModal /> }],
      },
      // 학생 상세 — 팀 상세에서만 진입하는 보조 상세(독립 목록 없음)
      { path: 'mentees/:studentId', element: <MenteeDetailPage /> },
      // TODO(후속 PR): teams/:teamId/{evaluation,recommendation}
      //   · evaluations · recommendations
    ],
  },
]
