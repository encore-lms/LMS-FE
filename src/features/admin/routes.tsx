import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 운영(매니저/ADMIN) 라우트 — features/admin 소유자만 편집.
const AdminDashboard = lazy(() => import('./AdminDashboard'))
const ReviewQueuePage = lazy(() => import('./certificates/ReviewQueuePage'))
const ReviewDetailPage = lazy(() => import('./certificates/ReviewDetailPage'))
const SnapshotPage = lazy(() => import('./certificates/SnapshotPage'))
const RecordReviewQueuePage = lazy(
  () => import('./records/RecordReviewQueuePage'),
)
const StudentManagementPage = lazy(
  () => import('./students/StudentManagementPage'),
)

export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'certificates/reviews', element: <ReviewQueuePage /> },
      { path: 'certificates/reviews/:reviewId', element: <ReviewDetailPage /> },
      {
        path: 'certificates/:certificateId/snapshot',
        element: <SnapshotPage />,
      },
      { path: 'records/review', element: <RecordReviewQueuePage /> },
      { path: 'students', element: <StudentManagementPage /> },
    ],
  },
]
