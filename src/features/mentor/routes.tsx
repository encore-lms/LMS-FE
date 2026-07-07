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
const LogSubmittedPage = lazy(() => import('./mentoring-logs/LogSubmittedPage'))
const RequestRespondedPage = lazy(
  () => import('./requests/RequestRespondedPage'),
)
const MenteeDetailPage = lazy(() => import('./mentees/MenteeDetailPage'))
const EvaluationPage = lazy(() => import('./evaluation/EvaluationPage'))
const EvaluationsSubmittedPage = lazy(
  () => import('./evaluation/EvaluationsSubmittedPage'),
)
const RecommendationPage = lazy(
  () => import('./recommendation/RecommendationPage'),
)
const RecommendationsSubmittedPage = lazy(
  () => import('./recommendation/RecommendationsSubmittedPage'),
)
// 마이 프로필 — 전 역할 공용 화면(features/profile), 헤더 아바타 드롭다운에서 진입(§7-X).
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'))

export const mentorRoutes: RouteObject[] = [
  {
    path: 'mentor',
    children: [
      // 대시보드 — index(/mentor)와 /mentor/dashboard 는 같은 화면(별칭, Figma 경로 표기 기준)
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'teams', element: <TeamsPage /> },
      { path: 'teams/:teamId', element: <TeamDetailPage /> },
      // 평가·추천 (M4) — 팀 단위 작성 화면. 게이트(N시간 완료/조기 종료 · 평가 제출 후
      // 추천 활성)는 화면에서 잠금 안내, mock 이 422 로 이중 차단.
      { path: 'teams/:teamId/evaluation', element: <EvaluationPage /> },
      { path: 'teams/:teamId/recommendation', element: <RecommendationPage /> },
      // 예약 응답 완료 요약 페이지 — 정적 경로를 동적 :requestId 보다 앞에
      {
        path: 'mentoring-requests/submitted',
        element: <RequestRespondedPage />,
      },
      {
        path: 'mentoring-requests',
        element: <RequestsPage />,
        // URL 라우팅 모달 — 목록 위 오버레이(중첩 라우트, 목록 탭·검색 상태 유지)
        children: [{ path: ':requestId', element: <RequestResponseModal /> }],
      },
      // 일지 작성/수정 — 정적 'new' 를 동적 :logId 보다 앞에(admin routes 주석 컨벤션)
      { path: 'mentoring-logs/new', element: <LogComposePage /> },
      // 제출 완료 요약 페이지 — 정적 경로를 동적 :logId 보다 앞에
      { path: 'mentoring-logs/submitted', element: <LogSubmittedPage /> },
      {
        path: 'mentoring-logs',
        element: <LogsPage />,
        // URL 라우팅 상세 모달 — 목록 위 오버레이(필터 상태 유지)
        children: [{ path: ':logId', element: <LogDetailModal /> }],
      },
      // 학생 상세 — 팀 상세에서만 진입하는 보조 상세(독립 목록 없음)
      { path: 'mentees/:studentId', element: <MenteeDetailPage /> },
      // 마이 프로필 — 계정 정보·비밀번호 변경(임시 비밀번호 수령 후 변경 경로).
      { path: 'profile', element: <ProfilePage /> },
      // 제출 완료 페이지 — Figma 2582:6400/6476(?toast=submitted 공통 토스트 1회 표시).
      { path: 'evaluations', element: <EvaluationsSubmittedPage /> },
      { path: 'recommendations', element: <RecommendationsSubmittedPage /> },
    ],
  },
]
