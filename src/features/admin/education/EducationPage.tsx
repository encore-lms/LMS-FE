import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { BookOpen, ChevronLeft, FolderOpen, ListChecks, Lock } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/use-toast'
import { CurriculumModal } from './CurriculumModal'
import { usePageHeader } from '@/shared/store'
import RecordsGridPage from '../records/RecordsGridPage'
import QuizListPage from '@/features/instructor/quizzes/QuizListPage'
import QnaListPage from '@/features/student/qna/QnaListPage'
import { StudentsPane } from '../students/StudentsPane'
import { MentoringPane } from '../mentoring/MentoringPane'
import { useCourseDetail } from './api'
import { MaterialsPane } from './MaterialsPane'
import { AssignmentsPane } from './AssignmentsPane'
import { ProjectsPane } from './ProjectsPane'
import { ResumePane } from './ResumePane'
import { useAdminCohorts } from './cohortRows'
import { SkeletonText } from '@/components/ui/Skeleton'

// 과정·기수·교과목 탭 — 자료실/과제/퀴즈/이력서/기록실/설정.
// 이력서=실 BE(ResumePane), 기록실=검토·심사 흡수(RecordReviewQueuePage 임베드). 설정=HRD 과정 상세.
type TabKey =
  | 'home'
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

// 운영 요구 순서 — 기수를 열어 가장 먼저 보는 것(홈·수강생·기록실)이 앞, 설정이 맨 뒤.
// 수강생·멘토링·QnA 는 사이드바 단독 메뉴에서 옮겨 왔다(기수를 고른 뒤 다루는 일이라 여기가 제자리).
const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: '과정 홈' },
  { key: 'students', label: '수강생' },
  { key: 'records', label: '기록실' },
  { key: 'quizzes', label: '퀴즈' },
  { key: 'projects', label: '프로젝트' },
  { key: 'assignments', label: '과제' },
  { key: 'resume', label: '이력서' },
  { key: 'mentoring', label: '멘토링' },
  { key: 'qna', label: 'QnA' },
  { key: 'materials', label: '자료실' },
  { key: 'settings', label: '설정' },
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

// 과정 홈 — 무엇을 보여 줄지 아직 정해지지 않았다. 내용이 정해지면 이 자리를 채운다.
function CourseHomePane() {
  return (
    <Empty
      icon={<FolderOpen className="h-6 w-6" />}
      title="과정 홈 준비 중"
      description="기수를 열었을 때 가장 먼저 보이는 화면입니다. 담을 내용이 정해지면 연결됩니다."
    />
  )
}

// 설명 탭 — HRD-Net 과정 상세 카드(이전 LMS CohortDetailsCard 재현).
function DescriptionPane({
  courseId,
  cohortId,
}: {
  courseId: string | null
  cohortId: string | null
}) {
  const { data, isPending, isError, refetch } = useCourseDetail(
    courseId,
    cohortId,
  )
  const toast = useToast()
  // 커리큘럼 설정 — 엑셀을 올리면 수강생 주차별 학습에 배우는 내용이 채워진다.
  const [curriculumOpen, setCurriculumOpen] = useState(false)

  const rows: { label: string; value: string }[] = data
    ? [
        { label: '훈련과정 구분', value: data.trainingType },
        { label: 'NCS 분류', value: data.ncsName },
        { label: '훈련기관', value: data.institution },
        { label: '소재지', value: data.address },
        { label: '지원 금액', value: data.supportAmount },
        { label: '담당자', value: data.manager },
        {
          label: '훈련기간',
          value: `~ (총 ${data.trainingDays}일 / ${data.trainingHours}시간)`,
        },
      ]
    : []

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={
        <div className="py-6">
          <SkeletonText lines={8} />
        </div>
      }
      errorTitle="과정 설명을 불러오지 못했어요"
      errorDescription="HRD 훈련과정ID가 없는 기수이거나 HRD-Net 연결을 확인해 주세요."
    >
      {data && (
        <div className="border-border bg-surface rounded-xl border p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-fg text-lg font-bold">{data.title}</h3>
            <span className="text-info flex items-center gap-1 text-xs font-medium">
              <Lock className="h-3 w-3" /> HRD-Net 원본
            </span>
          </div>
          <dl className="mt-5 flex flex-col gap-3">
            {rows.map((r) => (
              <div key={r.label} className="flex gap-4 text-sm">
                <dt className="text-fg-muted w-24 shrink-0 font-medium">
                  {r.label}
                </dt>
                <dd className="text-fg">{r.value}</dd>
              </div>
            ))}
          </dl>

          {/* 하단 설정 버튼 — 단위 기간/커리큘럼(이전 LMS '단위 기간 설정' 재현 + 커리큘럼 신규) */}
          <div className="border-divider mt-6 flex flex-wrap gap-2 border-t pt-5">
            <button
              type="button"
              // TODO: 단위 기간 설정 모달(BE 단위기간 계약 확정 후)
              onClick={() => toast.info('단위 기간 설정 화면은 준비 중입니다.')}
              className="bg-brand hover:bg-brand/90 text-on-color inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition-colors"
            >
              <ListChecks className="h-4 w-4" /> 단위 기간 설정
            </button>
            <button
              type="button"
              onClick={() => setCurriculumOpen(true)}
              disabled={!cohortId}
              className="bg-info-bg text-info border-border hover:bg-info-bg/70 inline-flex h-9 items-center gap-1.5 rounded-md border px-4 text-[13px] font-semibold transition-colors"
            >
              <BookOpen className="h-4 w-4" /> 커리큘럼 설정
            </button>
          </div>

          {curriculumOpen && (
            <CurriculumModal
              open
              cohortId={cohortId}
              cohortLabel={data.title}
              onClose={() => setCurriculumOpen(false)}
            />
          )}
        </div>
      )}
    </DataBoundary>
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
    row ? row.name : '과정/기수',
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
        <ChevronLeft className="h-4 w-4" /> 담당 과정/기수
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
          <CourseHomePane />
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
            <DescriptionPane courseId={courseId} cohortId={cohortId} />
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
