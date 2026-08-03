import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Tabs } from '@/components/ui/Tabs'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { TERMS, roleTag } from '@/shared/constants'
import { usePageHeader } from '@/shared/store'
import QuizListPage from '../quizzes/QuizListPage'
import QnaListPage from '@/features/student/qna/QnaListPage'
import EndorsementsPage from '../endorsements/EndorsementsPage'
import AssignmentsPage from '../assignments/AssignmentsPage'
import ProjectReviewPage from '../reviews/ProjectReviewPage'
import RecordReviewPage from '../reviews/RecordReviewPage'
import { useInstructorCohorts } from '../api/console'
import { MaterialsViewPane } from './MaterialsViewPane'
import { ResumeViewPane } from './ResumeViewPane'
import { NoticesPane } from './NoticesPane'
import { StudentsPane } from './StudentsPane'
import { CourseHomePane } from '@/features/admin/education/CourseHomePane'

// 강사 과정·기수 허브 — 운영 EducationPage와 같은 탭 구성(설정 탭은 강사에서 제외).
// 수강생·자료실·이력서 = 조회 전용(강사 /instructor 미러). 과제·퀴즈·프로젝트·기록 = 기존 강사 기능 화면 임베드(기수 스코프).
type TabKey =
  | 'home'
  | 'qna'
  | 'students'
  | 'notices'
  | 'materials'
  | 'assignments'
  | 'quizzes'
  | 'projects'
  | 'resume'
  | 'records'
  | 'endorsements'

// 공통 탭(과정 홈~기록실) 순서는 매니저 허브(EducationPage)와 동일 유지(2026-08-03 통일 기준측).
// 과정 홈은 공용 탭 승격(2026-08-03) — 운영 CourseHomePane을 /instructor 미러로 소비.
const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: '과정 홈' },
  { key: 'students', label: TERMS.student },
  { key: 'notices', label: TERMS.notice },
  { key: 'materials', label: '자료실' },
  { key: 'assignments', label: '과제' },
  { key: 'quizzes', label: '퀴즈' },
  { key: 'projects', label: '프로젝트' },
  { key: 'resume', label: '이력서' },
  { key: 'records', label: '기록실' },
  // 사이드바 'QnA 게시판' 흡수(2026-08-03, 운영 선례 미러) — 열람·답변, 스코프는 BE JWT 담당 기수.
  { key: 'qna', label: TERMS.qnaBoard },
  // 강사 추천서 이관(2026-07-24) — 단독 화면 폐기, 허브 마지막 탭으로 일원화. 강사 전용이라 roleTag.
  { key: 'endorsements', label: roleTag('코멘트/추천', '강사') },
]

export default function InstructorEducationPage() {
  const { cohortId = '' } = useParams()
  const { data } = useInstructorCohorts()
  const row = useMemo(
    () => (data?.rows ?? []).find((r) => r.id === cohortId) ?? null,
    [data, cohortId],
  )
  usePageHeader(
    row?.name ?? TERMS.educationCourse,
    row?.subtitle ?? `${TERMS.educationCourse}별 학습 자료와 활동을 확인합니다`,
  )

  const [tab, setTab] = useSearchParamState('tab', 'home')

  return (
    <div className="p-8">
      <Link
        to="/instructor/cohorts"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-1 text-sm font-medium"
      >
        <ChevronLeft className="h-4 w-4" /> {TERMS.educationCourse}
      </Link>

      <Tabs
        variant="underline"
        aria-label="교육 관리 탭"
        value={tab}
        onChange={setTab}
        items={TABS.map((t) => ({ value: t.key, label: t.label }))}
      />

      <div className="mt-6">
        {tab === 'home' ? (
          <CourseHomePane cohortId={cohortId} source="instructor" />
        ) : tab === 'students' ? (
          <StudentsPane cohortId={cohortId} />
        ) : tab === 'notices' ? (
          <NoticesPane
            cohortId={cohortId}
            detailPathOf={(id) =>
              `/instructor/cohorts/${cohortId}/notices/${id}`
            }
          />
        ) : tab === 'materials' ? (
          <MaterialsViewPane cohortId={cohortId} />
        ) : tab === 'assignments' ? (
          <AssignmentsPage embedded cohortId={cohortId} />
        ) : tab === 'quizzes' ? (
          <QuizListPage embedded cohortId={cohortId} />
        ) : tab === 'projects' ? (
          <ProjectReviewPage embedded cohortId={cohortId} />
        ) : tab === 'resume' ? (
          <ResumeViewPane cohortId={cohortId} />
        ) : tab === 'records' ? (
          <RecordReviewPage embedded cohortId={cohortId} />
        ) : tab === 'qna' ? (
          <QnaListPage
            embedded
            backTo={`/instructor/cohorts/${cohortId}/education?tab=qna`}
          />
        ) : (
          <EndorsementsPage embedded cohortId={cohortId} />
        )}
      </div>
    </div>
  )
}
