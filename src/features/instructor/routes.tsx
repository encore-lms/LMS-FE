import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 강사 라우트 — features/instructor 소유자만 편집.
const InstructorHome = lazy(() => import('./InstructorHome'))
const EndorsementsPage = lazy(() => import('./endorsements/EndorsementsPage'))
const EndorsementHistoryPage = lazy(
  () => import('./endorsements/EndorsementHistoryPage'),
)
const EndorsementDetailPage = lazy(
  () => import('./endorsements/EndorsementDetailPage'),
)

export const instructorRoutes: RouteObject[] = [
  {
    path: 'instructor',
    children: [
      { index: true, element: <InstructorHome /> },
      // 강사 추천서 (Flow 08-1) — /history는 :id보다 먼저(정적 경로 우선).
      { path: 'endorsements', element: <EndorsementsPage /> },
      { path: 'endorsements/history', element: <EndorsementHistoryPage /> },
      {
        path: 'endorsements/:endorsementId',
        element: <EndorsementDetailPage />,
      },
      // TODO(owner): 강사 화면 라우트 추가
    ],
  },
]
