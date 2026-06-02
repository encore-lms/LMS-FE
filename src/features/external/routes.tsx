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
