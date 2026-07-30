import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

// 운영(매니저/ADMIN) 라우트 — features/admin 소유자만 편집.
const AdminDashboard = lazy(() => import('./AdminDashboard'))
const ProfilePage = lazy(() => import('./profile/AdminProfilePage'))
const ReviewQueuePage = lazy(() => import('./certificates/ReviewQueuePage'))
const ReviewDetailPage = lazy(() => import('./certificates/ReviewDetailPage'))
const SnapshotPage = lazy(() => import('./certificates/SnapshotPage'))
const StudentManagementPage = lazy(
  () => import('./students/StudentManagementPage'),
)
// 담당 과정/기수 — 목록에서 기수를 고르고(CohortListPage) 허브로 들어간다(EducationPage).
const CohortListPage = lazy(() => import('./education/CohortListPage'))
const EducationPage = lazy(() => import('./education/EducationPage'))
// 과제 등록·수정 — 강사·운영 공용 폼(첨부 포함). 운영은 ?course&cohort로 진입.
const AssignmentFormPage = lazy(
  () => import('../instructor/assignments/AssignmentFormPage'),
)
// 과정·기수·교과목 이력서 상세(실 BE, 페이지 전환) — ResumePane에서 진입
const EducationResumeDetailPage = lazy(
  () => import('./education/ResumeDetailPage'),
)
// 역량 증명서 관리 — 과정·기수별 수강생 증명서 현황(증명서 템플릿 대체).
const CompetencyCertificatesPage = lazy(
  () => import('./certificates-competency/CompetencyCertificatesPage'),
)
const CompetencyCertificateDetailPage = lazy(
  () => import('./certificates-competency/CompetencyCertificateDetailPage'),
)
// CSV 매핑·업로드 (운영 전용 신설 — features/admin/csv, Figma 1521:10678)
const CsvMappingPage = lazy(() => import('./csv/CsvMappingPage'))
// 인입 격리 큐 (운영 전용 신설 — features/admin/ingestion, Figma 1185:6029)
const IngestionQueuePage = lazy(() => import('./ingestion/IngestionQueuePage'))
// 평판 관리 (운영 전용 신설 — features/admin/reputation, Figma 1193:6267)
const ReputationPage = lazy(() => import('./reputation/ReputationPage'))
// PLAY 타자 관리 (운영 전용 신설 — features/admin/play, Figma 3380:7959)
const TypingTextsPage = lazy(() => import('./play/TypingTextsPage'))
// 타자 제시문 일괄 업로드 (PLAY sub — features/admin/play/bulk, Figma 1546:11329)
const PlayBulkUploadPage = lazy(() => import('./play/bulk/BulkUploadPage'))
// 외부 연동 (운영 전용 신설 — features/admin/integrations, Figma 1546:11613)
const IntegrationsPage = lazy(() => import('./integrations/IntegrationsPage'))
// 마일리지 지급 내역 (클러스터 sub — features/admin/mileage/history, Figma 1197:6378)
const MileageHistoryPage = lazy(() => import('./mileage/history/HistoryPage'))
// 마일리지 직접 지급 (클러스터 sub — features/admin/mileage/direct-pay, Figma 1226:6549)
const MileageDirectPayPage = lazy(
  () => import('./mileage/direct-pay/DirectPayPage'),
)
// 마일리지 구매 요청 (클러스터 sub — features/admin/mileage/purchase-requests, Figma 1235:6815)
const MileagePurchasePage = lazy(
  () => import('./mileage/purchase-requests/PurchaseRequestsPage'),
)
// 마일리지 상품 관리 (클러스터 sub — features/admin/mileage/products, Figma 1246:7113)
const MileageProductsPage = lazy(
  () => import('./mileage/products/ProductsPage'),
)
// 마일리지 타입 한도 설정 (클러스터 sub — features/admin/mileage/type-limits, Figma 1252:7320)
const MileageTypeLimitsPage = lazy(
  () => import('./mileage/type-limits/TypeLimitsPage'),
)
// 계정 관리 = 설정 탭 랜딩(/admin/settings). 별도 운영 계정 권한 페이지/라우트는 폐지.
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
const QuizSubmissionsPage = lazy(
  () => import('@/features/instructor/quizzes/SubmissionsPage'),
)
// QnA 운영 (수강생 컴포넌트 재사용 — 'QnA 질문' 알림 목적지. 열람·답변만, 질문 작성·채택은 수강생 전용)
const QnaListPage = lazy(() => import('@/features/student/qna/QnaListPage'))
const QnaDetailPage = lazy(() => import('@/features/student/qna/QnaDetailPage'))
// 정답 관리 (운영 전용 신설 — features/admin/quizzes, Figma 1515:10493)
const QuizAnswersPage = lazy(() => import('./quizzes/AnswersPage'))
// 퀴즈 템플릿 — 강사 화면 재사용(운영 전용 화면 없음).
const QuizTemplateListPage = lazy(
  () => import('@/features/instructor/quiz-templates/TemplateListPage'),
)
const QuizTemplateFormPage = lazy(
  () => import('@/features/instructor/quiz-templates/TemplateFormPage'),
)
const QuizTemplateQuestionsPage = lazy(
  () => import('@/features/instructor/quiz-templates/TemplateQuestionsPage'),
)
// 수동 채점 (운영 전용 신설 B안 — 강사 GradingPage 대체, Figma 1515:10710)
const QuizGradingPage = lazy(() => import('./quizzes/GradingPage'))
// 멘토링 관리 (운영 전용 신설 — features/admin/mentoring,
// Figma 2744:7725 / 2745:7815 / 2746:7909 / 2749:8024 / 3206:3024)
const MentorAssignmentsPage = lazy(() => import('./mentoring/AssignmentsPage'))
const MentoringLogsPage = lazy(() => import('./mentoring/LogsPage'))
const MentoringLogTemplatesPage = lazy(
  () => import('./mentoring/LogTemplatesPage'),
)
const MentoringTeamDetailPage = lazy(
  () => import('./mentoring/MentoringTeamDetailPage'),
)
const MentoringTeamLogFieldsPage = lazy(
  () => import('./mentoring/TeamLogFieldsPage'),
)
const MentoringStatisticsPage = lazy(() => import('./mentoring/StatisticsPage'))
// 감사 로그 (운영 전용 신설 — features/admin/audit, Figma 1521:11112)
// 경로는 증명서(soulhn 소유) 하위지만 컴포넌트는 admin/audit(본인 소유)에 둠.
const AuditLogPage = lazy(() => import('./audit/AuditLogPage'))

export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    children: [
      { index: true, element: <AdminDashboard /> },
      // 실 auth 로그인 nextRoute(/admin/dashboard) 별칭 — index(/admin)와 같은 화면 (멘토 라우트 패턴)
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'education', element: <CohortListPage /> },
      // 과제 등록·수정 — 강사·운영 공용 폼(첨부 포함). /new 는 :assignmentId보다 먼저(정적 우선).
      {
        path: 'education/assignments/new',
        element: <AssignmentFormPage />,
      },
      {
        path: 'education/assignments/:assignmentId',
        element: <AssignmentFormPage />,
      },
      {
        path: 'education/resume/:resumeId',
        element: <EducationResumeDetailPage />,
      },
      // 기수 허브 — 정적 세그먼트(assignments·resume)를 동적 :cohortId 앞에 두는 컨벤션.
      { path: 'education/:cohortId', element: <EducationPage /> },
      { path: 'certificates', element: <CompetencyCertificatesPage /> },
      {
        path: 'certificates/:studentId',
        element: <CompetencyCertificateDetailPage />,
      },
      { path: 'csv-mapping', element: <CsvMappingPage /> },
      { path: 'ingestion/quarantine', element: <IngestionQueuePage /> },
      { path: 'reputation', element: <ReputationPage /> },
      { path: 'play/typing-texts', element: <TypingTextsPage /> },
      { path: 'play/typing-texts/bulk', element: <PlayBulkUploadPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      // 마일리지는 허브 없이 지급 내역이 첫 화면(허브 페이지 폐기).
      {
        path: 'mileage',
        element: <Navigate to="/admin/mileage/history" replace />,
      },
      { path: 'mileage/history', element: <MileageHistoryPage /> },
      { path: 'mileage/direct-pay', element: <MileageDirectPayPage /> },
      { path: 'mileage/purchase-requests', element: <MileagePurchasePage /> },
      { path: 'mileage/products', element: <MileageProductsPage /> },
      { path: 'mileage/type-limits', element: <MileageTypeLimitsPage /> },
      { path: 'certificates/reviews', element: <ReviewQueuePage /> },
      { path: 'certificates/reviews/:reviewId', element: <ReviewDetailPage /> },
      {
        path: 'certificates/:certificateId/snapshot',
        element: <SnapshotPage />,
      },
      // 감사 로그 — 스냅샷과 형제(증명서 하위). 컴포넌트는 admin/audit 소유.
      {
        path: 'certificates/:certificateId/audit',
        element: <AuditLogPage />,
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
        path: 'mentoring/teams/:teamId',
        element: <MentoringTeamDetailPage />,
      },
      {
        path: 'mentoring/teams/:teamId/log-fields',
        element: <MentoringTeamLogFieldsPage />,
      },
      { path: 'students', element: <StudentManagementPage /> },
      { path: 'settings', element: <SettingsAccountsPage /> },
      { path: 'settings/hrd-api-key', element: <HrdApiKeyPage /> },
      { path: 'settings/course-config', element: <CourseConfigPage /> },
      { path: 'settings/courses/new', element: <CourseAddPage /> },
      // 퀴즈 운영 (강사 컴포넌트 재사용, 경로 패턴도 강사와 동일) — /admin/quizzes* 라우트
      { path: 'quizzes', element: <QuizListPage /> },
      { path: 'quizzes/new', element: <QuizFormPage /> },
      // 정답 관리 — 운영 전용(:quizId 하위지만 정적 'answers' 세그먼트를 동적 앞 컨벤션 위치에)
      { path: 'quizzes/:quizId/answers', element: <QuizAnswersPage /> },
      { path: 'quizzes/:quizId/edit', element: <QuizFormPage /> },
      { path: 'quizzes/:quizId/submissions', element: <QuizSubmissionsPage /> },
      {
        path: 'quizzes/:quizId/submissions/:submissionId/grade',
        element: <QuizGradingPage />,
      },
      // 퀴즈 템플릿 운영 — 강사와 같은 화면. 없으면 '템플릿 관리'가 강사 경로로 나가
      // 역할 가드에 막혀 대시보드로 튕긴다. /new 는 :templateId 보다 먼저(정적 우선).
      { path: 'quiz-templates', element: <QuizTemplateListPage /> },
      { path: 'quiz-templates/new', element: <QuizTemplateFormPage /> },
      {
        path: 'quiz-templates/:templateId/edit',
        element: <QuizTemplateFormPage />,
      },
      {
        path: 'quiz-templates/:templateId/questions',
        element: <QuizTemplateQuestionsPage />,
      },
      // QnA 운영 — 'QnA 질문' 알림(매니저 브로드캐스트) 목적지. 수강생 화면 재사용.
      { path: 'qna', element: <QnaListPage /> },
      { path: 'qna/:id', element: <QnaDetailPage /> },
    ],
  },
]
