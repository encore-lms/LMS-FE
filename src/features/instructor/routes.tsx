import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

// 강사 라우트 — features/instructor 소유자만 편집.
const CohortsPage = lazy(() => import('./cohorts/CohortsPage'))
const CohortStudentsPage = lazy(() => import('./cohorts/CohortStudentsPage'))
const StudentDetailPage = lazy(() => import('./cohorts/StudentDetailPage'))
const RecordReviewPage = lazy(() => import('./reviews/RecordReviewPage'))
const ProjectReviewPage = lazy(() => import('./reviews/ProjectReviewPage'))
const TsReviewPage = lazy(() => import('./reviews/TsReviewPage'))
const EndorsementsPage = lazy(() => import('./endorsements/EndorsementsPage'))
const EndorsementHistoryPage = lazy(
  () => import('./endorsements/EndorsementHistoryPage'),
)
const EndorsementDetailPage = lazy(
  () => import('./endorsements/EndorsementDetailPage'),
)
const QuizListPage = lazy(() => import('./quizzes/QuizListPage'))
const ChangeRequestsPage = lazy(
  () => import('./change-requests/ChangeRequestsPage'),
)
const RecertificationsPage = lazy(
  () => import('./change-requests/RecertificationsPage'),
)
const NoCohortPage = lazy(() => import('./dashboard/NoCohortNotice'))
const AssignmentsPage = lazy(() => import('./assignments/AssignmentsPage'))
const AssignmentFormPage = lazy(
  () => import('./assignments/AssignmentFormPage'),
)
const AssignmentSubmissionsPage = lazy(
  () => import('./assignments/SubmissionsPage'),
)
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
      // 강사 대시보드는 BE 엔드포인트 미구현 상태라, 로그인 랜딩(index)과 별칭(dashboard)을
      // 동작하는 평가 관리(퀴즈)로 리다이렉트한다. 대시보드 BE 구축 후 원복 예정.
      { index: true, element: <Navigate to="/instructor/quizzes" replace /> },
      {
        path: 'dashboard',
        element: <Navigate to="/instructor/quizzes" replace />,
      },
      // 강사 콘솔 골격 (§2·§3) — 기수 컨텍스트는 후속 화면에 유지.
      { path: 'cohorts', element: <CohortsPage /> },
      { path: 'cohorts/:cohortId/students', element: <CohortStudentsPage /> },
      { path: 'students/:studentId', element: <StudentDetailPage /> },
      // 검토 3종 (§13~§15) — 사이드바 '검토' 묶음.
      { path: 'records/review', element: <RecordReviewPage /> },
      { path: 'projects/review', element: <ProjectReviewPage /> },
      { path: 'troubleshooting/review', element: <TsReviewPage /> },
      // 인증 후 통합 검토 (P0 29 §11~§12 대체) — 변경 제안·재인증, 사이드바 '인증 후 변경 제안' 묶음.
      { path: 'change-requests', element: <ChangeRequestsPage /> },
      { path: 'recertifications', element: <RecertificationsPage /> },
      // 담당 기수 없음 안내 — 대시보드가 cohortCount 0이면 동일 안내로 분기.
      { path: 'no-cohort', element: <NoCohortPage /> },
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
      // 과제·실습 Main Flow (P0 30) — /new는 :assignmentId보다 먼저(정적 경로 우선).
      // :assignmentId가 상세+수정 단일 폼(생성 정책: 생성/수정 후 상세 화면 이동).
      { path: 'assignments', element: <AssignmentsPage /> },
      { path: 'assignments/new', element: <AssignmentFormPage /> },
      {
        path: 'assignments/:assignmentId/submissions',
        element: <AssignmentSubmissionsPage />,
      },
      { path: 'assignments/:assignmentId', element: <AssignmentFormPage /> },
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
