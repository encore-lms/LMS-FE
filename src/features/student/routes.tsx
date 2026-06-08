import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { OnboardingGate } from './onboarding/OnboardingGate'

// 수강생 라우트 — features/student 소유자만 편집(결합 해소: 공유 router.tsx를 건드리지 않는다).
const DashboardPage = lazy(() => import('./dashboard/DashboardPage'))
const CourseHomePage = lazy(() => import('./course/home/CourseHomePage'))
const MaterialsPage = lazy(() => import('./course/materials/MaterialsPage'))
const AssignmentsPage = lazy(
  () => import('./course/assignments/AssignmentsPage'),
)
const AssignmentDetailPage = lazy(
  () => import('./course/assignments/AssignmentDetailPage'),
)
const CompetencyReportPage = lazy(
  () => import('./course/competency/CompetencyReportPage'),
)
const MentoringPage = lazy(() => import('./mentoring/MentoringPage'))
const CertificatePage = lazy(() => import('./certificate/CertificatePage'))
const CertChangesPage = lazy(() => import('./certificate/ChangesRequestedPage'))
const CertPublicationPage = lazy(() => import('./certificate/PublicationPage'))
const QuizListPage = lazy(() => import('./quiz/QuizListPage'))
const AttendanceView = lazy(() => import('./attendance/AttendanceView'))
const AttendanceFormPage = lazy(
  () => import('./attendance/form/AttendanceFormPage'),
)
const ProfilePage = lazy(() => import('./profile/ProfilePage'))
const QuizTakePage = lazy(() => import('./quiz/QuizTakePage'))
const QuizResultPage = lazy(() => import('./quiz/QuizResultPage'))
const RecordsPage = lazy(() => import('./records/RecordsPage'))
const BlogFormPage = lazy(() => import('./records/forms/BlogFormPage'))
const BlogEditPage = lazy(() => import('./records/forms/BlogEditPage'))
const StudyFormPage = lazy(() => import('./records/forms/StudyFormPage'))
const CertFormPage = lazy(() => import('./records/forms/CertFormPage'))
const OnboardingPage = lazy(() => import('./onboarding/OnboardingPage'))
const ProjectListPage = lazy(() => import('./projects/ProjectListPage'))
const ProjectWizardPage = lazy(
  () => import('./projects/wizard/ProjectWizardPage'),
)
const WorkspacePage = lazy(() => import('./projects/workspace/WorkspacePage'))
const ChangeRequestPage = lazy(() => import('./projects/ChangeRequestPage'))
const TsListPage = lazy(
  () => import('./troubleshooting/TroubleshootingListPage'),
)
const TsDetailPage = lazy(() => import('./troubleshooting/CaseDetailPage'))
const TsNewPage = lazy(() => import('./troubleshooting/forms/NewCasePage'))
const TsChangePage = lazy(
  () => import('./troubleshooting/forms/ChangeRequestPage'),
)
const PlaySelectPage = lazy(() => import('./play/PlaySelectPage'))
const PlayTypingPage = lazy(() => import('./play/PlayTypingPage'))
const PlayResultPage = lazy(() => import('./play/PlayResultPage'))
const MileagePage = lazy(() => import('./mileage/MileagePage'))
const MileageProductsPage = lazy(() => import('./mileage/ProductsPage'))
const MileageRequestsPage = lazy(() => import('./mileage/RequestStatesPage'))
const MileageHistoryPage = lazy(() => import('./mileage/HistoryPage'))
const PeerHubPage = lazy(() => import('./peer/PeerHubPage'))
const PeerTagPage = lazy(() => import('./peer/PeerTagPage'))
const PeerReputationPage = lazy(() => import('./peer/PeerReputationPage'))

export const studentRoutes: RouteObject[] = [
  {
    path: 'student',
    // 온보딩 미완료 수강생은 게이트가 /student/onboarding 으로 보낸다(쉘 안 영역 전체).
    element: <OnboardingGate />,
    children: [
      // 사이드바 '대시보드' → /student (index). 수강생 랜딩 = 대시보드.
      { index: true, element: <DashboardPage /> },
      // 사이드바 '나의 과정' → /student/course (강의 홈). 자료실은 하위 탭.
      { path: 'course', element: <CourseHomePage /> },
      { path: 'course/materials', element: <MaterialsPage /> },
      { path: 'course/assignments', element: <AssignmentsPage /> },
      {
        path: 'course/assignments/:assignmentId',
        element: <AssignmentDetailPage />,
      },
      { path: 'course/competency', element: <CompetencyReportPage /> },
      { path: 'mentoring', element: <MentoringPage /> },
      { path: 'certificate', element: <CertificatePage /> },
      { path: 'certificate/changes-requested', element: <CertChangesPage /> },
      { path: 'certificate/publication', element: <CertPublicationPage /> },
      { path: 'quizzes', element: <QuizListPage /> },
      // 기록실(목록) + 블로그/스터디/자격증 등록 폼 + 블로그 수정.
      { path: 'records', element: <RecordsPage /> },
      { path: 'records/new/blog', element: <BlogFormPage /> },
      { path: 'records/new/study', element: <StudyFormPage /> },
      { path: 'records/new/certificate', element: <CertFormPage /> },
      { path: 'records/blog/:recordId/edit', element: <BlogEditPage /> },
      // 프로젝트(목록·생성 마법사·워크스페이스 10탭·변경 제안).
      { path: 'projects', element: <ProjectListPage /> },
      { path: 'projects/new', element: <ProjectWizardPage /> },
      { path: 'projects/:projectId', element: <WorkspacePage /> },
      {
        path: 'projects/:projectId/change-requests/new',
        element: <ChangeRequestPage />,
      },
      // 트러블슈팅(목록·상세·새 작성·변경 제안).
      { path: 'troubleshooting', element: <TsListPage /> },
      { path: 'troubleshooting/new', element: <TsNewPage /> },
      { path: 'troubleshooting/:id', element: <TsDetailPage /> },
      {
        path: 'troubleshooting/:id/change-requests/new',
        element: <TsChangePage />,
      },
      // PLAY(게임 선택·타자 게임·결과/예외 상태).
      { path: 'play', element: <PlaySelectPage /> },
      { path: 'play/typing', element: <PlayTypingPage /> },
      { path: 'play/result', element: <PlayResultPage /> },
      // 마일리지(내 마일리지·상품 신청·구매 요청 상태·사용 내역).
      { path: 'mileage', element: <MileagePage /> },
      { path: 'mileage/products', element: <MileageProductsPage /> },
      { path: 'mileage/requests', element: <MileageRequestsPage /> },
      { path: 'mileage/history', element: <MileageHistoryPage /> },
      // 동료 평가 — 기수 단위 PeerTag와 PeerReputation 입력.
      { path: 'peer-evaluations', element: <PeerHubPage /> },
      { path: 'peer-tag', element: <PeerTagPage /> },
      { path: 'peer-reputation', element: <PeerReputationPage /> },
      // 출결/태도(조회) + 출결 폼(작성). STUDENT 전용 가드는 취합층(router.tsx)에서 적용됨.
      { path: 'attendance', element: <AttendanceView /> },
      { path: 'attendance/form', element: <AttendanceFormPage /> },
      // 마이 프로필 — 사이드바 아님(헤더 아바타 메뉴). 라우트만 등록.
      { path: 'profile', element: <ProfilePage /> },
      // 퀴즈 결과는 쉘 안(일반 페이지). 응시(take)는 집중 모드라 쉘 밖 — studentFullscreenRoutes.
      { path: 'quizzes/:quizId/result', element: <QuizResultPage /> },
    ],
  },
]

// 전체화면(쉘 없음) 라우트 — 퀴즈 응시 집중 모드. 취합층(router.tsx)이 AppShell 밖에 마운트한다.
export const studentFullscreenRoutes: RouteObject[] = [
  { path: 'student/quizzes/:quizId/take', element: <QuizTakePage /> },
  // 온보딩 마법사 — 자체 헤더·푸터의 풀스크린 플로우라 쉘 밖.
  { path: 'student/onboarding', element: <OnboardingPage /> },
]
