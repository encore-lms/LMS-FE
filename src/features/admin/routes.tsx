import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 운영(매니저/ADMIN) 라우트 — features/admin 소유자만 편집.
const AdminDashboard = lazy(() => import('./AdminDashboard'))
const ReviewQueuePage = lazy(() => import('./certificates/ReviewQueuePage'))
const ReviewDetailPage = lazy(() => import('./certificates/ReviewDetailPage'))
const SnapshotPage = lazy(() => import('./certificates/SnapshotPage'))
const RecordsGridPage = lazy(() => import('./records/RecordsGridPage'))
const StudentManagementPage = lazy(
  () => import('./students/StudentManagementPage'),
)
const ResumePage = lazy(() => import('./resume/ResumePage'))
const ResumeDetailPage = lazy(() => import('./resume/ResumeDetailPage'))
// 과정·기수·교과목 통합 관리 (운영 전용 신설 — features/admin/education, Figma 1543:11011)
const EducationPage = lazy(() => import('./education/EducationPage'))
// 과정·기수·교과목 이력서 상세(실 BE, 페이지 전환) — ResumePane에서 진입
const EducationResumeDetailPage = lazy(
  () => import('./education/ResumeDetailPage'),
)
// 증명서 템플릿 (운영 전용 신설 — features/admin/certificate-template, Figma 1521:10895)
const CertificateTemplatePage = lazy(
  () => import('./certificate-template/CertificateTemplatePage'),
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
// 마일리지 관리 허브 (운영 전용 신설 — features/admin/mileage, Figma 1127:5639)
const MileagePage = lazy(() => import('./mileage/MileagePage'))
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
// 설정 감사 로그 전체 페이지 (계정 관리 '전체 로그'에서 진입, Figma 5190:11189)
const SettingsAuditPage = lazy(() => import('./settings/SettingsAuditPage'))
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
// 감사 로그 (운영 전용 신설 — features/admin/audit, Figma 1521:11112)
// 경로는 증명서(soulhn 소유) 하위지만 컴포넌트는 admin/audit(본인 소유)에 둠.
const AuditLogPage = lazy(() => import('./audit/AuditLogPage'))

export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'education', element: <EducationPage /> },
      {
        path: 'education/resume/:resumeId',
        element: <EducationResumeDetailPage />,
      },
      { path: 'certificate-template', element: <CertificateTemplatePage /> },
      { path: 'csv-mapping', element: <CsvMappingPage /> },
      { path: 'ingestion/quarantine', element: <IngestionQueuePage /> },
      { path: 'reputation', element: <ReputationPage /> },
      { path: 'play/typing-texts', element: <TypingTextsPage /> },
      { path: 'play/typing-texts/bulk', element: <PlayBulkUploadPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'mileage', element: <MileagePage /> },
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
      { path: 'records/review', element: <RecordsGridPage /> },
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
      { path: 'settings', element: <SettingsAccountsPage /> },
      { path: 'settings/hrd-api-key', element: <HrdApiKeyPage /> },
      { path: 'settings/course-config', element: <CourseConfigPage /> },
      { path: 'settings/courses/new', element: <CourseAddPage /> },
      { path: 'settings/audit', element: <SettingsAuditPage /> },
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
