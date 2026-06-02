import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 강사 라우트 — features/instructor 소유자만 편집.
const InstructorHome = lazy(() => import('./InstructorHome'))

export const instructorRoutes: RouteObject[] = [
  {
    path: 'instructor',
    children: [
      { index: true, element: <InstructorHome /> },
      // TODO(owner): 강사 화면 라우트 추가
    ],
  },
]
