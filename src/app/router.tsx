import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { RoleEntry } from '@/features/auth/RoleEntry'
import { LoginPage } from '@/features/auth/LoginPage'
import { StyleGuidePage } from '@/features/styleguide/StyleGuidePage'
import { studentRoutes } from '@/features/student/routes'
import { instructorRoutes } from '@/features/instructor/routes'
import { mentorRoutes } from '@/features/mentor/routes'
import { adminRoutes } from '@/features/admin/routes'
import { externalRoutes } from '@/features/external/routes'

// 취합 전용 파일 — 각 역할 라우트는 features/<role>/routes.tsx가 소유한다.
// 이 파일은 새 shell을 추가/제거할 때만 손댄다(평소 도메인 작업에서 건드리지 않음 = 결합 해소).
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/_styleguide', element: <StyleGuidePage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <RoleEntry /> },
          ...studentRoutes,
          ...instructorRoutes,
          ...mentorRoutes,
          ...adminRoutes,
          ...externalRoutes,
        ],
      },
    ],
  },
])
