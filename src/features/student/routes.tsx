import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 수강생 라우트 — features/student 소유자만 편집(결합 해소: 공유 router.tsx를 건드리지 않는다).
const StudentHome = lazy(() => import('./StudentHome'))

export const studentRoutes: RouteObject[] = [
  {
    path: 'student',
    children: [
      { index: true, element: <StudentHome /> },
      // TODO(owner): 수강생 화면 라우트 추가
    ],
  },
]
