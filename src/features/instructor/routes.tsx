import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 강사 라우트 — features/instructor 소유자만 편집.
const DashboardPage = lazy(() => import('./dashboard/DashboardPage'))
const CohortsPage = lazy(() => import('./cohorts/CohortsPage'))
const CohortStudentsPage = lazy(() => import('./cohorts/CohortStudentsPage'))
const StudentDetailPage = lazy(() => import('./cohorts/StudentDetailPage'))
const EndorsementsPage = lazy(() => import('./endorsements/EndorsementsPage'))
const EndorsementHistoryPage = lazy(
  () => import('./endorsements/EndorsementHistoryPage'),
)
const EndorsementDetailPage = lazy(
  () => import('./endorsements/EndorsementDetailPage'),
)
const QuizListPage = lazy(() => import('./quizzes/QuizListPage'))
const TemplateListPage = lazy(() => import('./quiz-templates/TemplateListPage'))
const TemplateFormPage = lazy(() => import('./quiz-templates/TemplateFormPage'))
const TemplateQuestionsPage = lazy(
  () => import('./quiz-templates/TemplateQuestionsPage'),
)
const QuizFormPage = lazy(() => import('./quizzes/QuizFormPage'))
const QuestionManagePage = lazy(() => import('./quizzes/QuestionManagePage'))
const SubmissionsPage = lazy(() => import('./quizzes/SubmissionsPage'))
const GradingPage = lazy(() => import('./quizzes/GradingPage'))

export const instructorRoutes: RouteObject[] = [
  {
    path: 'instructor',
    children: [
      { index: true, element: <DashboardPage /> },
      // 강사 콘솔 골격 (§2·§3) — 기수 컨텍스트는 후속 화면에 유지.
      { path: 'cohorts', element: <CohortsPage /> },
      { path: 'cohorts/:cohortId/students', element: <CohortStudentsPage /> },
      { path: 'students/:studentId', element: <StudentDetailPage /> },
      // 강사 추천서 (Flow 08-1) — /history는 :id보다 먼저(정적 경로 우선).
      { path: 'endorsements', element: <EndorsementsPage /> },
      { path: 'endorsements/history', element: <EndorsementHistoryPage /> },
      {
        path: 'endorsements/:endorsementId',
        element: <EndorsementDetailPage />,
      },
      // 퀴즈 Main Flow (§5~§9) — /new는 :quizId보다 먼저(정적 경로 우선).
      { path: 'quizzes', element: <QuizListPage /> },
      { path: 'quizzes/new', element: <QuizFormPage /> },
      { path: 'quizzes/:quizId/edit', element: <QuizFormPage /> },
      { path: 'quizzes/:quizId/questions', element: <QuestionManagePage /> },
      { path: 'quizzes/:quizId/submissions', element: <SubmissionsPage /> },
      {
        path: 'quizzes/:quizId/submissions/:submissionId/grade',
        element: <GradingPage />,
      },
      // 퀴즈 템플릿 (§10) — /new는 :templateId보다 먼저(정적 경로 우선).
      { path: 'quiz-templates', element: <TemplateListPage /> },
      { path: 'quiz-templates/new', element: <TemplateFormPage /> },
      {
        path: 'quiz-templates/:templateId/edit',
        element: <TemplateFormPage />,
      },
      {
        path: 'quiz-templates/:templateId/questions',
        element: <TemplateQuestionsPage />,
      },
      // TODO(owner): 강사 화면 라우트 추가
    ],
  },
]
