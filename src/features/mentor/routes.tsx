import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 멘토 라우트 — features/mentor 소유자만 편집.
const MentorHome = lazy(() => import('./MentorHome'))

export const mentorRoutes: RouteObject[] = [
  {
    path: 'mentor',
    children: [
      { index: true, element: <MentorHome /> },
      // TODO(owner): 멘토 화면 라우트 추가
    ],
  },
]
