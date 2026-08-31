import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { OnboardingGate } from './onboarding/OnboardingGate'
import { CertificateAccessGate } from './certificate/CertificateAccessGate'

// 수강생 라우트 — features/student 소유자만 편집(결합 해소: 공유 router.tsx를 건드리지 않는다).
const DashboardPage = lazy(() => import('./dashboard/DashboardPage'))
const CourseHomePage = lazy(() => import('./course/home/CourseHomePage'))
const MaterialsPage = lazy(() => import('./course/materials/MaterialsPage'))
const CourseNoticesPage = lazy(() => import('./course/notices/NoticesPage'))
const CourseNoticeDetailPage = lazy(
  () => import('./course/notices/NoticeDetailPage'),
)
const AssignmentsPage = lazy(
  () => import('./course/assignments/AssignmentsPage'),
)
const AssignmentDetailPage = lazy(
  () => import('./course/assignments/AssignmentDetailPage'),
)
// 진단 리포트 — LLM 수준 진단 PoV 주간 리포트(교육과정 허브 탭).
const DiagnosisReportPage = lazy(
  () => import('./course/diagnosis/DiagnosisReportPage'),
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
const ResumePage = lazy(() => import('./resume/ResumePage'))
const ResumeEditorPage = lazy(() => import('./resume/ResumeEditorPage'))
const RecordsPage = lazy(() => import('./records/RecordsPage'))
const BlogFormPage = lazy(() => import('./records/forms/BlogFormPage'))
const BlogEditPage = lazy(() => import('./records/forms/BlogEditPage'))
const StudyFormPage = lazy(() => import('./records/forms/StudyFormPage'))
const StudyEditPage = lazy(() => import('./records/forms/StudyEditPage'))
const CertFormPage = lazy(() => import('./records/forms/CertFormPage'))
const CertEditPage = lazy(() => import('./records/forms/CertEditPage'))
const OnboardingPage = lazy(() => import('./onboarding/OnboardingPage'))
const ProjectListPage = lazy(() => import('./projects/ProjectListPage'))
const ProjectWizardPage = lazy(
  () => import('./projects/wizard/ProjectWizardPage'),
)
const WorkspacePage = lazy(() => import('./projects/workspace/WorkspacePage'))
const ChangeRequestPage = lazy(() => import('./projects/ChangeRequestPage'))
const TsDetailPage = lazy(() => import('./troubleshooting/CaseDetailPage'))
const TsNewPage = lazy(() => import('./troubleshooting/forms/NewCasePage'))
// QnA 게시판 — 목록·작성·상세(FE 선반영). 기수 게시판 폐기(2026-05-21) 이후 재도입 프로토타입.
const QnaListPage = lazy(() => import('./qna/QnaListPage'))
const QnaNewPage = lazy(() => import('./qna/forms/NewQuestionPage'))
const QnaEditPage = lazy(() => import('./qna/forms/EditQuestionPage'))
const QnaDetailPage = lazy(() => import('./qna/QnaDetailPage'))
const PlaySelectPage = lazy(() => import('./play/PlaySelectPage'))
const PlayTypingPage = lazy(() => import('./play/PlayTypingPage'))
const PlayTypingResultPage = lazy(() => import('./play/PlayTypingResultPage'))
const PlayCodingPage = lazy(() => import('./play/PlayCodingPage'))
const PlayCodingResultPage = lazy(() => import('./play/PlayCodingResultPage'))
const PlayQuizPage = lazy(() => import('./play/PlayQuizPage'))
const PlayQuizResultPage = lazy(() => import('./play/PlayQuizResultPage'))
const MileagePage = lazy(() => import('./mileage/MileagePage'))

export const studentRoutes: RouteObject[] = [
  {
    path: 'student',
    // 온보딩 미완료 수강생은 게이트가 /student/onboarding 으로 보낸다(쉘 안 영역 전체).
    element: <OnboardingGate />,
    children: [
      // 사이드바 '대시보드' → /student (index). 수강생 랜딩 = 대시보드.
      { index: true, element: <DashboardPage /> },
      // 실 auth 로그인 nextRoute(/student/dashboard) 별칭 — index와 같은 화면 (멘토 라우트 패턴)
      { path: 'dashboard', element: <DashboardPage /> },
      // 사이드바 '나의 과정' → /student/course (강의 홈). 자료실은 하위 탭.
      { path: 'course', element: <CourseHomePage /> },
      { path: 'course/notices', element: <CourseNoticesPage /> },
      // 공지 상세 — 스태프 상세와 같은 한 벌(읽기 전용, 2026-08-05).
      {
        path: 'course/notices/:noticeId',
        element: <CourseNoticeDetailPage />,
      },
      { path: 'course/materials', element: <MaterialsPage /> },
      { path: 'course/assignments', element: <AssignmentsPage /> },
      {
        path: 'course/assignments/:assignmentId',
        element: <AssignmentDetailPage />,
      },
      { path: 'course/diagnosis', element: <DiagnosisReportPage /> },
      { path: 'mentoring', element: <MentoringPage /> },
      {
        path: 'certificate',
        element: <CertificateAccessGate />,
        children: [
          { index: true, element: <CertificatePage /> },
          { path: 'changes-requested', element: <CertChangesPage /> },
          { path: 'publication', element: <CertPublicationPage /> },
        ],
      },
      { path: 'quizzes', element: <QuizListPage /> },
      // 대시보드가 퀴즈 하나를 짚어 보낸다(/student/quizzes/{id}) — 그 퀴즈만 여는 화면은
      // 없으므로 목록이 받아 해당 줄로 데려간다. 눌렀을 뿐인데 시험이 시작되면 안 되므로
      // 응시(take)로 바로 보내지 않는다.
      { path: 'quizzes/:quizId', element: <QuizListPage /> },
      // 이력서 관리 — 목록/작성 현황 + 편집기(Doc/Edit). 셸 안(사이드바 '이력서 관리' 유지).
      { path: 'resume', element: <ResumePage /> },
      { path: 'resume/new', element: <ResumeEditorPage /> },
      { path: 'resume/:resumeId/edit', element: <ResumeEditorPage /> },
      // 기록실(목록) + 블로그/스터디/자격증 등록 폼 + 블로그 수정.
      { path: 'records', element: <RecordsPage /> },
      { path: 'records/new/blog', element: <BlogFormPage /> },
      { path: 'records/new/study', element: <StudyFormPage /> },
      { path: 'records/new/certificate', element: <CertFormPage /> },
      { path: 'records/blog/:recordId/edit', element: <BlogEditPage /> },
      { path: 'records/study/:recordId/edit', element: <StudyEditPage /> },
      {
        path: 'records/certificate/:recordId/edit',
        element: <CertEditPage />,
      },
      // 프로젝트(목록·생성 마법사·워크스페이스 10탭·변경 제안).
      { path: 'projects', element: <ProjectListPage /> },
      { path: 'projects/new', element: <ProjectWizardPage /> },
      { path: 'projects/:projectId', element: <WorkspacePage /> },
      {
        path: 'projects/:projectId/change-requests/new',
        element: <ChangeRequestPage />,
      },
      // 트러블슈팅 — 별도 탭을 폐기하고(2026-08-19) 프로젝트 이슈 탭에서 쓰고 읽는다.
      // 남는 라우트는 그 이슈 탭이 여는 작성·상세 화면뿐이다.
      { path: 'troubleshooting/new', element: <TsNewPage /> },
      { path: 'troubleshooting/:id', element: <TsDetailPage /> },
      // QnA 게시판(목록·작성·상세). learning-service 실 연동(api/qna.ts).
      { path: 'qna', element: <QnaListPage /> },
      { path: 'qna/new', element: <QnaNewPage /> },
      { path: 'qna/:id', element: <QnaDetailPage /> },
      { path: 'qna/:id/edit', element: <QnaEditPage /> },
      // PLAY(게임 선택·타자/코딩/CS퀴즈 게임·게임별 결과).
      { path: 'play', element: <PlaySelectPage /> },
      { path: 'play/typing', element: <PlayTypingPage /> },
      { path: 'play/typing/result', element: <PlayTypingResultPage /> },
      { path: 'play/coding', element: <PlayCodingPage /> },
      { path: 'play/coding/result', element: <PlayCodingResultPage /> },
      { path: 'play/quiz', element: <PlayQuizPage /> },
      { path: 'play/quiz/result', element: <PlayQuizResultPage /> },
      // 마일리지 — 단일 페이지(내역·구매요청·상품·장바구니 뷰 전환). 이전 LMS 구조.
      { path: 'mileage', element: <MileagePage /> },
      // 구 라우트는 단일 페이지 뷰로 리다이렉트(북마크·기존 링크 보존).
      {
        path: 'mileage/products',
        element: <Navigate to="/student/mileage?view=shop" replace />,
      },
      {
        path: 'mileage/cart',
        element: <Navigate to="/student/mileage?view=cart" replace />,
      },
      {
        path: 'mileage/history',
        element: <Navigate to="/student/mileage?view=history" replace />,
      },
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
  // 증명서 미리보기 — 사이드바 없이 전체화면으로 증명서 모습만 보여준다(보기 전용).
]
