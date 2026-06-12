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
const RecordReviewDetailPage = lazy(
  () => import('./records/RecordReviewDetailPage'),
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
// 정답 관리 (운영 전용 신설 — features/admin/quizzes, Figma 1515:10493)
const QuizAnswersPage = lazy(() => import('./quizzes/AnswersPage'))
// 수동 채점 (운영 전용 신설 B안 — 강사 GradingPage 대체, Figma 1515:10710)
const QuizGradingPage = lazy(() => import('./quizzes/GradingPage'))
// 멘토링 관리 (운영 전용 신설 — features/admin/mentoring,
// Figma 2744:7725 / 2745:7815 / 2746:7909 / 2749:8024 / 3206:3024)
const MentorAssignmentsPage = lazy(() => import('./mentoring/AssignmentsPage'))
const MentoringLogsPage = lazy(() => import('./mentoring/LogsPage'))
const MentoringLogTemplatesPage = lazy(
  () => import('./mentoring/LogTemplatesPage'),
)
const MentoringTeamLogFieldsPage = lazy(
  () => import('./mentoring/TeamLogFieldsPage'),
)
const MentoringStatisticsPage = lazy(() => import('./mentoring/StatisticsPage'))

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
      // 검토 상세 3종 — 정적 records/review 뒤. URL 세그먼트 certificates(복수)는
      // 페이지에서 RecordCategory certificate(단수)로 매핑(detailMeta.ts).
      {
        path: 'records/blog/:submissionId',
        element: <RecordReviewDetailPage segment="blog" />,
      },
      {
        path: 'records/study/:submissionId',
        element: <RecordReviewDetailPage segment="study" />,
      },
      {
        path: 'records/certificates/:submissionId',
        element: <RecordReviewDetailPage segment="certificates" />,
      },
      // 멘토링 관리 — 배정(/admin/mentors/*)·일지·템플릿·통계(/admin/mentoring/*).
      // 정적 세그먼트(logs·log-templates·statistics)를 동적 teams/:teamId 앞 컨벤션 위치에.
      { path: 'mentors/assignments', element: <MentorAssignmentsPage /> },
      { path: 'mentoring/logs', element: <MentoringLogsPage /> },
      {
        path: 'mentoring/log-templates',
        element: <MentoringLogTemplatesPage />,
      },
      { path: 'mentoring/statistics', element: <MentoringStatisticsPage /> },
      {
        path: 'mentoring/teams/:teamId/log-fields',
        element: <MentoringTeamLogFieldsPage />,
      },
      { path: 'students', element: <StudentManagementPage /> },
      { path: 'resume', element: <ResumePage /> },
      { path: 'resume/:resumeId', element: <ResumeDetailPage /> },
      { path: 'settings', element: <SettingsHubPage /> },
      { path: 'settings/accounts', element: <SettingsAccountsPage /> },
      { path: 'settings/hrd-api-key', element: <HrdApiKeyPage /> },
      { path: 'settings/course-config', element: <CourseConfigPage /> },
      { path: 'settings/courses/new', element: <CourseAddPage /> },
      // 퀴즈 운영 (강사 컴포넌트 재사용, 경로 패턴도 강사와 동일) — /admin/quizzes* 라우트
      { path: 'quizzes', element: <QuizListPage /> },
      { path: 'quizzes/new', element: <QuizFormPage /> },
      // 정답 관리 — 운영 전용(:quizId 하위지만 정적 'answers' 세그먼트를 동적 앞 컨벤션 위치에)
      { path: 'quizzes/:quizId/answers', element: <QuizAnswersPage /> },
      { path: 'quizzes/:quizId/edit', element: <QuizFormPage /> },
      { path: 'quizzes/:quizId/questions', element: <QuestionManagePage /> },
      { path: 'quizzes/:quizId/submissions', element: <QuizSubmissionsPage /> },
      {
        path: 'quizzes/:quizId/submissions/:submissionId/grade',
        element: <QuizGradingPage />,
      },
    ],
  },
]
