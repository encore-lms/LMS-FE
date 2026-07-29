import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 알림 전체 화면 — 역할 가드 없이 로그인한 모든 사용자가 같은 화면을 쓴다.
// 알림은 역할별로 내용만 다를 뿐 화면이 같아, 역할 경로마다 복제할 이유가 없다.
const NotificationsPage = lazy(() =>
  import('./NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)

export const notificationRoutes: RouteObject[] = [
  { path: 'notifications', element: <NotificationsPage /> },
]
