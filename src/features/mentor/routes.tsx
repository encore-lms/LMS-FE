import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 멘토 라우트 — features/mentor 소유자만 편집. MENTOR 가드는 src/app/router.tsx 에 기배선.
//
// 예약·일지·평가·추천은 팀 상세(/mentor/teams/:teamId)의 탭으로 들어갔다(2026-08-04).
// 독립 목록·제출 완료 화면은 사이드바에서 빠진 뒤 아무 데서도 닿지 않아 걷어냈다 —
// 남겨 두면 주소를 아는 사람만 도달하는, 아무도 고치지 않는 화면이 된다.
// 일지 작성 폼만 전체 화면이라 페이지로 남는다(팀에서 ?from= 을 달고 진입).
const DashboardPage = lazy(() => import('./dashboard/DashboardPage'))
const TeamsPage = lazy(() => import('./teams/TeamsPage'))
const TeamDetailPage = lazy(() => import('./teams/TeamDetailPage'))
// 폴더명은 mentoring-logs — 루트 .gitignore 의 'logs' 패턴(빌드 로그용)과 충돌 회피.
const LogComposePage = lazy(() => import('./mentoring-logs/LogComposePage'))
const LogSubmittedPage = lazy(() => import('./mentoring-logs/LogSubmittedPage'))
const MenteeDetailPage = lazy(() => import('./mentees/MenteeDetailPage'))
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
      // 일지 작성/수정 — 정적 'new' 를 동적 :logId 보다 앞에(admin routes 주석 컨벤션)
      { path: 'mentoring-logs/new', element: <LogComposePage /> },
      // 제출 완료 요약 페이지 — 정적 경로를 동적 :logId 보다 앞에
      { path: 'mentoring-logs/submitted', element: <LogSubmittedPage /> },
      // 학생 상세 — 팀 상세에서만 진입하는 보조 상세(독립 목록 없음)
      { path: 'mentees/:studentId', element: <MenteeDetailPage /> },
      // 마이 프로필 — 계정 정보·비밀번호 변경(임시 비밀번호 수령 후 변경 경로).
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]
