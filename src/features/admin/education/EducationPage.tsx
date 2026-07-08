import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import {
  AlertTriangle,
  BookOpen,
  FolderOpen,
  ListChecks,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import RecordsGridPage from '../records/RecordsGridPage'
import QuizListPage from '@/features/instructor/quizzes/QuizListPage'
import { useCourseConfig, useCourseList } from '../api/settings'
import { useCourseDetail } from './api'
import { MaterialsPane } from './MaterialsPane'
import { AssignmentsPane } from './AssignmentsPane'
import { ProjectsPane } from './ProjectsPane'
import { ResumePane } from './ResumePane'
import { SkeletonText } from '@/components/ui/Skeleton'

// 과정·기수·교과목 탭 — 자료실/과제/퀴즈/이력서/기록실/설정.
// 이력서=실 BE(ResumePane), 기록실=검토·심사 흡수(RecordReviewQueuePage 임베드). 설정=HRD 과정 상세.
type TabKey =
  | 'materials'
  | 'assignments'
  | 'quizzes'
  | 'projects'
  | 'resume'
  | 'records'
  | 'settings'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'materials', label: '자료실' },
  { key: 'assignments', label: '과제' },
  { key: 'quizzes', label: '퀴즈' },
  { key: 'projects', label: '프로젝트' },
  { key: 'resume', label: '이력서' },
  { key: 'records', label: '기록실' },
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

// 아직 별도 흡수 대상이 없는 탭(과제) — 준비 중 안내.
function PlaceholderPane({ label }: { label: string }) {
  return (
    <Empty
      icon={<FolderOpen className="h-6 w-6" />}
      title={`${label} 설정 준비 중`}
      description="이 탭은 과정·기수별 설정 화면으로 곧 연결됩니다."
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

  if (isPending) {
    return (
      <div className="py-6">
        <SkeletonText lines={8} />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="과정 설명을 불러오지 못했어요"
        description="HRD 훈련과정ID가 없는 기수이거나 HRD-Net 연결을 확인해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const rows: { label: string; value: string }[] = [
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

  return (
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
          // TODO: 커리큘럼 설정 화면(BE 커리큘럼/교과목 계약 확정 후)
          onClick={() => toast.info('커리큘럼 설정 화면은 준비 중입니다.')}
          className="bg-info-bg text-info border-border hover:bg-info-bg/70 inline-flex h-9 items-center gap-1.5 rounded-md border px-4 text-[13px] font-semibold transition-colors"
        >
          <BookOpen className="h-4 w-4" /> 커리큘럼 설정
        </button>
      </div>
    </div>
  )
}

// 과정·기수·교과목 (/admin/education). 과정/기수 선택 + 6탭(자료실/과제/퀴즈/이력서/기록실/설정).
export default function EducationPage() {
  usePageHeader(
    '과정·기수·교과목',
    '과정·기수별 학습 자료와 활동을 한 곳에서 관리합니다',
  )

  const { data: courses } = useCourseList()
  // 과정·기수·탭을 URL에 반영 — 새로고침·이력서 상세 왕복에서 컨텍스트 유지(딥링크).
  const [courseParam, setCourseParam] = useSearchParamState('course')
  const courseId = courseParam || courses?.[0]?.courseId || null
  const { data: courseConfig } = useCourseConfig(courseId)
  const [cohortParam, setCohortParam] = useSearchParamState('cohort')
  const cohortId = cohortParam || courseConfig?.cohorts?.[0]?.id || null

  const [tab, setTab] = useSearchParamState('tab', 'materials')

  return (
    <div className="p-8">
      {/* 과정/기수 선택 — 공용 Select(커스텀 listbox)로 브라우저 기본 옵션 팝업 대체 */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="과정 선택"
          value={courseId}
          onChange={(v) => {
            setCourseParam(v)
            setCohortParam('')
          }}
          options={(courses ?? []).map((c) => ({
            value: c.courseId,
            label: c.title,
          }))}
          placeholder="등록 과정 없음"
          className="h-11"
        />
        <Select
          aria-label="기수 선택"
          value={cohortId}
          onChange={(v) => setCohortParam(v)}
          options={(courseConfig?.cohorts ?? []).map((c) => ({
            value: c.id,
            label: `${c.cohortNo}기`,
          }))}
          placeholder="기수 없음"
          className="h-11"
        />
      </div>

      {/* 탭 */}
      <div className="border-divider mt-5 flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium',
              tab === t.key
                ? 'text-brand border-brand border-b-2'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'resume' ? (
          // 이력서 현황·상세·피드백(실 BE, 정본 §32).
          !courseId || !cohortId ? (
            <NeedCourse />
          ) : (
            <ResumePane courseId={courseId} cohortId={cohortId} />
          )
        ) : tab === 'records' ? (
          // 검토·심사 '학습 기록 검토' 흡수.
          <RecordsGridPage cohortId={cohortId} />
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
