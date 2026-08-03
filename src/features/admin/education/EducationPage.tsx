import { Link, useParams } from 'react-router-dom'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { TERMS, roleTag } from '@/shared/constants'
import { ChevronLeft, FolderOpen } from 'lucide-react'
import { Empty } from '@/components/ui/Empty'
import { Tabs } from '@/components/ui/Tabs'
import { usePageHeader } from '@/shared/store'
import RecordsGridPage from '../records/RecordsGridPage'
import QuizListPage from '@/features/instructor/quizzes/QuizListPage'
import { NoticesPane } from '@/features/instructor/education/NoticesPane'
import QnaListPage from '@/features/student/qna/QnaListPage'
import { StudentsPane } from '../students/StudentsPane'
import { MentoringPane } from '../mentoring/MentoringPane'
import { MaterialsPane } from './MaterialsPane'
import { AssignmentsPane } from './AssignmentsPane'
import { ProjectsPane } from './ProjectsPane'
import { ResumePane } from './ResumePane'
import { CourseHomePane } from './CourseHomePane'
import { SettingsPane } from './SettingsPane'
import { useAdminCohorts } from './cohortRows'

// 과정·기수·교과목 탭 — 자료실/과제/퀴즈/이력서/기록실/설정.
// 이력서=실 BE(ResumePane), 기록실=검토·심사 흡수(RecordReviewQueuePage 임베드). 설정=HRD 과정 상세.
type TabKey =
  | 'home'
  | 'notices'
  | 'students'
  | 'records'
  | 'quizzes'
  | 'projects'
  | 'assignments'
  | 'resume'
  | 'mentoring'
  | 'qna'
  | 'materials'
  | 'settings'

// 탭 순서 — 강사 허브와 공통 탭(수강생~기록실)의 상대 순서를 동일하게 유지한다(2026-08-03 통일).
// 매니저 전용 탭(과정 홈·멘토링·설정)은 roleTag 접미로 명시하고 공통 구간의 앞·뒤에 배치.
const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: roleTag('과정 홈', '매니저') },
  { key: 'students', label: TERMS.student },
  { key: 'notices', label: TERMS.notice },
  { key: 'materials', label: '자료실' },
  { key: 'assignments', label: '과제' },
  { key: 'quizzes', label: '퀴즈' },
  { key: 'projects', label: '프로젝트' },
  { key: 'resume', label: '이력서' },
  { key: 'records', label: '기록실' },
  { key: 'qna', label: TERMS.qnaBoard },
  { key: 'mentoring', label: roleTag('멘토링', '매니저') },
  { key: 'settings', label: roleTag('설정', '매니저') },
]

// 과정/기수 미선택 안내(자료실·설정 탭 공용).
function NeedCourse() {
  return (
    <Empty
      icon={<FolderOpen className="h-6 w-6" />}
      title="조회할 과정·기수를 선택하세요"
      description="등록된 과정이 없으면 ‘교육 과정 추가’에서 먼저 등록해 주세요."
    />
  )
}

// 아직 별도 흡수 대상이 없는 탭 — 준비 중 안내.
function PlaceholderPane({ label }: { label: string }) {
  return (
    <Empty
      icon={<FolderOpen className="h-6 w-6" />}
      title={`${label} 설정 준비 중`}
      description="이 탭은 과정·기수별 설정 화면으로 곧 연결됩니다."
    />
  )
}

// 기수 허브 (/admin/education/:cohortId) — 목록에서 고른 기수 하나를 탭으로 파고든다.
// 예전에는 이 화면 안에서 과정·기수 드롭다운을 갈아 끼웠는데, 지금 어느 기수를 보는지
// 드러나지 않았다. 선택은 목록 화면(CohortListPage)이 맡는다.
export default function EducationPage() {
  const { cohortId = '' } = useParams()
  const { data } = useAdminCohorts()
  const row = data?.rows.find((r) => r.id === cohortId) ?? null
  const courseId = row?.courseId ?? null

  usePageHeader(
    row ? row.name : TERMS.educationCourse,
    row
      ? `${row.period} · 학습 자료와 활동을 한 곳에서 관리합니다`
      : '학습 자료와 활동을 한 곳에서 관리합니다',
  )

  const [tab, setTab] = useSearchParamState('tab', 'home')

  return (
    <div className="p-8">
      <Link
        to="/admin/education"
        className="text-fg-muted hover:text-fg inline-flex items-center gap-1 text-[13px] font-medium"
      >
        <ChevronLeft className="h-4 w-4" /> 교육과정
      </Link>

      {/* 탭 */}
      <Tabs
        variant="underline"
        aria-label="교육 관리 탭"
        value={tab}
        onChange={setTab}
        items={TABS.map((t) => ({ value: t.key, label: t.label }))}
        className="mt-5"
      />

      <div className="mt-6">
        {tab === 'home' ? (
          // 이 기수 수강생이 보는 강의 홈 그대로 — 주차별 학습·공지·진도.
          !cohortId ? (
            <NeedCourse />
          ) : (
            <CourseHomePane cohortId={cohortId} />
          )
        ) : tab === 'notices' ? (
          // 강사 허브와 같은 한 벌 — 매니저는 어떤 글이든 지울 수 있다(서버 canDelete 판정).
          !cohortId ? (
            <NeedCourse />
          ) : (
            <NoticesPane cohortId={cohortId} />
          )
        ) : tab === 'resume' ? (
          // 이력서 현황·상세·피드백(실 BE, 정본 §32).
          !courseId || !cohortId ? (
            <NeedCourse />
          ) : (
            <ResumePane courseId={courseId} cohortId={cohortId} />
          )
        ) : tab === 'records' ? (
          // 검토·심사 '학습 기록 검토' 흡수.
          <RecordsGridPage cohortId={cohortId} />
        ) : tab === 'students' ? (
          // 사이드바 '학생 관리' 흡수 — 출결·출결 폼·계정. 기수는 이미 정해졌으니 셀렉터는 없다.
          !courseId || !cohortId ? (
            <NeedCourse />
          ) : (
            <StudentsPane scope={{ courseId, cohortId }} paramKey="stab" />
          )
        ) : tab === 'mentoring' ? (
          // 사이드바 '멘토링 관리' 흡수 — 배정·일지·일지 템플릿·통계.
          !courseId || !cohortId ? (
            <NeedCourse />
          ) : (
            <MentoringPane
              courseId={courseId}
              cohortId={cohortId}
              courseName={row?.courseTitle}
              cohortLabel={row?.cohortLabel}
            />
          )
        ) : tab === 'qna' ? (
          // 사이드바 'QnA 게시판' 흡수 — 열람·답변(작성은 수강생 전용).
          <QnaListPage
            embedded
            backTo={`/admin/education/${cohortId}?tab=qna`}
          />
        ) : tab === 'quizzes' ? (
          // 학습·보상 '퀴즈 운영' 흡수 — 선택 기수로 스코프(실 BE).
          <QuizListPage embedded cohortId={cohortId} />
        ) : tab === 'projects' ? (
          // 기수 프로젝트 목록(실 BE, 정본 §42·§43).
          !courseId || !cohortId ? (
            <NeedCourse />
          ) : (
            <ProjectsPane courseId={courseId} cohortId={cohortId} />
          )
        ) : tab === 'materials' ? (
          !courseId || !cohortId ? (
            <NeedCourse />
          ) : (
            <MaterialsPane courseId={courseId} cohortId={cohortId} />
          )
        ) : tab === 'assignments' ? (
          !courseId || !cohortId ? (
            <NeedCourse />
          ) : (
            <AssignmentsPane courseId={courseId} cohortId={cohortId} />
          )
        ) : tab === 'settings' ? (
          !courseId || !cohortId ? (
            <NeedCourse />
          ) : (
            <SettingsPane courseId={courseId} cohortId={cohortId} />
          )
        ) : (
          <PlaceholderPane
            label={TABS.find((t) => t.key === tab)?.label ?? ''}
          />
        )}
      </div>
    </div>
  )
}
