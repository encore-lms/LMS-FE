import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

// 강사 라우트 — features/instructor 소유자만 편집.
const DashboardPage = lazy(() => import('./dashboard/DashboardPage'))
const CohortsPage = lazy(() => import('./cohorts/CohortsPage'))
const InstructorEducationPage = lazy(
  () => import('./education/InstructorEducationPage'),
)
// 이력서 상세는 운영과 공용(source='instructor') — 사본 통합(2026-08-03).
const ResumeDetailPage = lazy(
  () => import('@/features/admin/education/ResumeDetailPage'),
)
// 공지 상세 — 허브 '공지' 탭에서 카드를 눌러 진입(운영과 같은 화면).
const InstructorNoticeDetailPage = lazy(
  () => import('./education/NoticeDetailPage'),
)
const ProjectReviewPage = lazy(() => import('./reviews/ProjectReviewPage'))
const TsReviewPage = lazy(() => import('./reviews/TsReviewPage'))
const EndorsementDetailPage = lazy(
  () => import('./endorsements/EndorsementDetailPage'),
)
const ChangeRequestsPage = lazy(
  () => import('./change-requests/ChangeRequestsPage'),
)
const RecertificationsPage = lazy(
  () => import('./change-requests/RecertificationsPage'),
)
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
const SubmissionsPage = lazy(() => import('./quizzes/SubmissionsPage'))
const GradingPage = lazy(() => import('./quizzes/GradingPage'))
// QnA 게시판 — 수강생 화면을 강사 경로에 그대로 마운트(운영과 동일 방식).
// 열람·답변만 하며 보이는 질문은 BE가 담당 기수로 스코프한다(useQnaBase가 API base를 결정).
const QnaListPage = lazy(() => import('@/features/student/qna/QnaListPage'))
const QnaDetailPage = lazy(() => import('@/features/student/qna/QnaDetailPage'))
// 마이 프로필 — 전 역할 공용 화면(features/profile), 헤더 아바타 드롭다운에서 진입(§7-X).
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'))

export const instructorRoutes: RouteObject[] = [
  {
    path: 'instructor',
    children: [
      // 강사 로그인 랜딩(index)은 대시보드로. auth 세션도 /instructor/dashboard 지정.
      { index: true, element: <Navigate to="/instructor/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      // 강사 콘솔 골격 (§2·§3) — 기수 컨텍스트는 후속 화면에 유지.
      { path: 'cohorts', element: <CohortsPage /> },
      // 과정·기수·교과목 허브 — 과정 클릭 시 7탭(자료실·과제·퀴즈·프로젝트·이력서·기록실·설정).
      {
        path: 'cohorts/:cohortId/education',
        element: <InstructorEducationPage />,
      },
      // 이력서 상세 — 허브 '이력서' 탭에서 진입(문서 뷰 + 피드백 작성).
      {
        path: 'cohorts/:cohortId/resumes/:resumeId',
        element: <ResumeDetailPage source="instructor" />,
      },
      // 공지 상세 — 허브 '공지' 탭에서 카드 클릭으로 진입.
      {
        path: 'cohorts/:cohortId/notices/:noticeId',
        element: <InstructorNoticeDetailPage />,
      },
      // 수강생 목록·상세 단독 화면은 폐기 — 허브 '수강생' 탭(StudentsPane)으로 일원화.
      // 검토 2종 (§14~§15) — 사이드바 '검토' 묶음. 학습 기록 조회는 허브 '기록실' 탭으로 이관.
      { path: 'projects/review', element: <ProjectReviewPage /> },
      { path: 'troubleshooting/review', element: <TsReviewPage /> },
      // 인증 후 통합 검토 (P0 29 §11~§12 대체) — 변경 제안·재인증, 사이드바 '인증 후 변경 제안' 묶음.
      { path: 'change-requests', element: <ChangeRequestsPage /> },
      { path: 'recertifications', element: <RecertificationsPage /> },
      // 담당 기수 없음 안내는 대시보드가 cohortCount 0일 때 인라인 렌더(별도 라우트 없음).
      // 마이 프로필 — 계정 정보·비밀번호 변경(임시 비밀번호 수령 후 변경 경로).
      { path: 'profile', element: <ProfilePage /> },
      // 강사 추천서 (Flow 08-1) — 단독 목록·전체 보기 모두 폐기, 허브 '코멘트/추천' 탭으로 일원화.
      // 상세 라우트만 유지(허브 행에서 진입).
      {
        path: 'endorsements',
        element: <Navigate to="/instructor/cohorts" replace />,
      },
      // 폐기된 전체 보기 URL(북마크·기존 링크) — :endorsementId 가 'history'를 ID로 잡아
      // 빈 상세 화면이 뜨는 것을 막는다. 정적 경로라 :endorsementId 보다 먼저 매칭된다.
      {
        path: 'endorsements/history',
        element: <Navigate to="/instructor/cohorts" replace />,
      },
      {
        path: 'endorsements/:endorsementId',
        element: <EndorsementDetailPage />,
      },
      // 퀴즈 Main Flow (§5~§9) — /new는 :quizId보다 먼저(정적 경로 우선).
      // 독립 퀴즈 목록은 폐기 — 교육 과정 허브(퀴즈 탭)로 일원화. 폼·제출 라우트는 유지.
      {
        path: 'quizzes',
        element: <Navigate to="/instructor/cohorts" replace />,
      },
      { path: 'quizzes/new', element: <QuizFormPage /> },
      { path: 'quizzes/:quizId/edit', element: <QuizFormPage /> },
      { path: 'quizzes/:quizId/submissions', element: <SubmissionsPage /> },
      {
        path: 'quizzes/:quizId/submissions/:submissionId/grade',
        element: <GradingPage />,
      },
      // 과제·실습 Main Flow (P0 30) — /new는 :assignmentId보다 먼저(정적 경로 우선).
      // :assignmentId가 상세+수정 단일 폼(생성 정책: 생성/수정 후 상세 화면 이동).
      // 독립 과제 목록은 폐기 — 교육 과정 허브(과제 탭)로 일원화. 폼·제출 라우트는 유지.
      {
        path: 'assignments',
        element: <Navigate to="/instructor/cohorts" replace />,
      },
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
      // QnA 게시판 (§74~76) — 담당 기수 수강생 질문 열람·답변.
      { path: 'qna', element: <QnaListPage /> },
      { path: 'qna/:id', element: <QnaDetailPage /> },
      // TODO(owner): 강사 화면 라우트 추가
    ],
  },
]
