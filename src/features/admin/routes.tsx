import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 운영(매니저/ADMIN) 라우트 — features/admin 소유자만 편집.
const AdminDashboard = lazy(() => import('./AdminDashboard'))

export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    children: [
      { index: true, element: <AdminDashboard /> },
      // 다음: 학생 계정 관리(/admin/students)·인증 검토 큐(/admin/certificates/reviews)
    ],
  },
]
