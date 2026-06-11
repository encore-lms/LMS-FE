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
const ResumePage = lazy(() => import('./resume/ResumePage'))
const ResumeDetailPage = lazy(() => import('./resume/ResumeDetailPage'))
const SettingsHubPage = lazy(() => import('./settings/SettingsHubPage'))
const SettingsAccountsPage = lazy(() => import('./settings/AccountsPage'))
const HrdApiKeyPage = lazy(() => import('./settings/HrdApiKeyPage'))
const CourseConfigPage = lazy(() => import('./settings/CourseConfigPage'))
const CourseAddPage = lazy(() => import('./settings/CourseAddPage'))
// 퀴즈 운영 (강사 컴포넌트 재사용, P0)
const QuizListPage = lazy(
  () => import('@/features/instructor/quizzes/QuizListPage'),
)
const QuizFormPage = lazy(
  () => import('@/features/instructor/quizzes/QuizFormPage'),
)
const QuestionManagePage = lazy(
  () => import('@/features/instructor/quizzes/QuestionManagePage'),
)
const QuizSubmissionsPage = lazy(
  () => import('@/features/instructor/quizzes/SubmissionsPage'),
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
      { path: 'resume', element: <ResumePage /> },
      { path: 'resume/:resumeId', element: <ResumeDetailPage /> },
      { path: 'settings', element: <SettingsHubPage /> },
      { path: 'settings/accounts', element: <SettingsAccountsPage /> },
      { path: 'settings/hrd-api-key', element: <HrdApiKeyPage /> },
      { path: 'settings/course-config', element: <CourseConfigPage /> },
      { path: 'settings/courses/new', element: <CourseAddPage /> },
      // 퀴즈 운영 (강사 컴포넌트 재사용) — /admin/quizzes* 라우트
      { path: 'quizzes', element: <QuizListPage /> },
      { path: 'quizzes/new', element: <QuizFormPage /> },
      { path: 'quizzes/:quizId', element: <QuizFormPage /> },
      { path: 'quizzes/:quizId/questions', element: <QuestionManagePage /> },
      { path: 'quizzes/:quizId/submissions', element: <QuizSubmissionsPage /> },
    ],
  },
]
