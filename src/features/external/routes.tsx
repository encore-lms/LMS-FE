import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 외부 검증 라우트 — features/external 소유자만 편집.
const ExternalHome = lazy(() => import('./ExternalHome'))

export const externalRoutes: RouteObject[] = [
  {
    path: 'external',
    children: [
      { index: true, element: <ExternalHome /> },
      // TODO(owner): 외부 검증 화면 라우트 추가
    ],
  },
]

// 비로그인 public 라우트 — 외부 검증 URL(/verify/:publicToken).
// 취합층(router.tsx)이 AuthGuard 밖 최상위('/login' 형제)에 마운트한다
// (studentFullscreenRoutes 분리 export 패턴). 이후 외부검증 화면 추가는 이 파일만 수정.
export const externalPublicRoutes: RouteObject[] = [
  {
    path: '/verify/:publicToken',
    // AppShell 밖이라 상위 Suspense 경계가 없음 — route-level lazy(RR7)로
    // 라우터가 모듈 로드를 대기시킨다(외부 공유 링크 하드 로드가 주 경로).
    lazy: async () => ({
      Component: (await import('./verify/VerifyPage')).default,
    }),
  },
]
