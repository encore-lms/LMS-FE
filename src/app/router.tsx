import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppShell } from '@/components/layout'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { RequireRole } from '@/features/auth/RequireRole'
import { RoleEntry } from '@/features/auth/RoleEntry'
import { LoginPage } from '@/features/auth/LoginPage'
import { StyleGuidePage } from '@/features/styleguide/StyleGuidePage'
import {
  studentRoutes,
  studentFullscreenRoutes,
} from '@/features/student/routes'
import { instructorRoutes } from '@/features/instructor/routes'
import { mentorRoutes } from '@/features/mentor/routes'
import { adminRoutes } from '@/features/admin/routes'
import {
  externalRoutes,
  externalPublicRoutes,
} from '@/features/external/routes'
import type { Role } from '@/shared/types'
import { MENUS } from './menus'

// 역할 가드로 감싼 라우트 그룹 — 가드는 여기(취합층)서 중앙 적용해 역할 routes.tsx는 순수하게 둔다.
function guarded(allow: Role[], routes: RouteObject[]): RouteObject {
  return { element: <RequireRole allow={allow} />, children: routes }
}

// 취합 전용 파일 — 각 역할 라우트·메뉴는 features/<role>/가 소유한다.
// 이 파일은 새 shell 추가/제거·가드 매핑 변경 때만 손댄다(평소 도메인 작업에서 건드리지 않음).
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/_styleguide', element: <StyleGuidePage /> },
  // 비로그인 public — 외부 검증(/verify/:publicToken). AuthGuard 밖 최상위 마운트.
  ...externalPublicRoutes,
  {
    element: <AuthGuard />,
    children: [
      // 전체화면(쉘 없음) — 퀴즈 응시 집중 모드. AppShell 밖에서 STUDENT 가드만 적용.
      guarded(['STUDENT'], studentFullscreenRoutes),
      {
        element: <AppShell menus={MENUS} />,
        children: [
          { index: true, element: <RoleEntry /> },
          guarded(['STUDENT'], studentRoutes),
          guarded(['INSTRUCTOR'], instructorRoutes),
          guarded(['MENTOR'], mentorRoutes),
          guarded(['MANAGER', 'ADMIN'], adminRoutes),
          ...externalRoutes,
        ],
      },
    ],
  },
])
