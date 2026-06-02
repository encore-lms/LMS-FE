import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 운영(매니저/ADMIN) 라우트 — features/admin 소유자만 편집.
const AdminHome = lazy(() => import('./AdminHome'))

export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    children: [
      { index: true, element: <AdminHome /> },
      // TODO(owner): 운영 화면 라우트 추가
    ],
  },
]
