import { useState } from 'react'
import { AlertTriangle, FolderOpen, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useCourseConfig, useCourseList } from '../api/settings'
import { useCourseDetail, useEducationOverview } from './api'
import type { EducationModuleRow } from './types'

type TabKey = 'description' | 'modules'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'description', label: '설명' },
  { key: 'modules', label: '교과목/모듈' },
]

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

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
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
    </div>
  )
}

// 교과목/모듈 탭 — 기존 통합 관리(mock). 별도 BE 계약 확정 후 확장.
function ModulesPane() {
  const { data, isPending, isError, refetch } = useEducationOverview()
  const toast = useToast()

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="교과목/모듈 정보를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const { summary, rows } = data
  const columns: Column<EducationModuleRow>[] = [
    {
      key: 'cohort',
      header: '과정/기수',
      cell: (r) => (
        <span className="text-fg text-[13px] font-medium">{r.cohortLabel}</span>
      ),
    },
    {
      key: 'module',
      header: '교과목/모듈',
      cell: (r) => <span className="text-fg text-[13px]">{r.moduleName}</span>,
    },
    {
      key: 'unit',
      header: '기간',
      className: 'w-28',
      cell: (r) => <span className="text-fg text-[13px]">{r.unit}</span>,
    },
    {
      key: 'owner',
      header: '담당자',
      className: 'w-32',
      cell: (r) => <span className="text-fg text-[13px]">{r.owner}</span>,
    },
    {
      key: 'linked',
      header: '연결 기능',
      cell: (r) => (
        <span className="text-fg-muted text-[13px]">{r.linkedFeatures}</span>
      ),
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-20',
      cell: (r) => (
        <button
          type="button"
          onClick={() =>
            toast.info(`${r.moduleName} 수정 화면은 준비 중입니다.`)
          }
          className="text-brand text-[13px] font-semibold hover:underline"
        >
          수정
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="과정"
          value={summary.courses}
          hint={`HRD 연동 ${summary.coursesHrdLinked}`}
        />
        <KpiCard
          label="기수"
          value={summary.cohorts}
          hint={`운영중 ${summary.cohortsActive}`}
        />
        <KpiCard
          label="교과목/모듈"
          value={summary.modules}
          hint="신규 설계 영역"
        />
        <KpiCard
          label="주차 기준"
          value={summary.weeks}
          hint="기록실/퀴즈 연결"
        />
      </div>
      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          empty="등록된 교과목/모듈이 없어요"
        />
        <div className="text-fg-subtle mt-3 text-xs">총 {rows.length}건</div>
      </div>
    </>
  )
}

// 과정·기수·교과목 통합 관리 (/admin/education). 과정/기수 선택 + 설명·교과목 탭.
export default function EducationPage() {
  usePageHeader('과정·기수·교과목', '과정/기수 선택 → 설명·교과목 관리')

  const { data: courses } = useCourseList()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const courseId = selectedCourseId ?? courses?.[0]?.courseId ?? null
  const { data: courseConfig } = useCourseConfig(courseId)
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null)
  const cohortId = selectedCohortId ?? courseConfig?.cohorts?.[0]?.id ?? null

  const [tab, setTab] = useState<TabKey>('description')

  return (
    <div className="p-8">
      {/* 과정/기수 선택 */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="과정 선택"
          value={courseId ?? ''}
          onChange={(e) => {
            setSelectedCourseId(e.target.value)
            setSelectedCohortId(null)
          }}
          className="border-border focus:border-brand text-fg h-11 rounded-lg border bg-white px-3 text-sm outline-none"
        >
          {(courses ?? []).map((c) => (
            <option key={c.courseId} value={c.courseId}>
              {c.title}
            </option>
          ))}
          {(courses ?? []).length === 0 && (
            <option value="">등록 과정 없음</option>
          )}
        </select>
        <select
          aria-label="기수 선택"
          value={cohortId ?? ''}
          onChange={(e) => setSelectedCohortId(e.target.value)}
          className="border-border focus:border-brand text-fg h-11 rounded-lg border bg-white px-3 text-sm outline-none"
        >
          {(courseConfig?.cohorts ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.cohortNo}기
            </option>
          ))}
          {(courseConfig?.cohorts ?? []).length === 0 && (
            <option value="">기수 없음</option>
          )}
        </select>
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
        {!courseId || !cohortId ? (
          <Empty
            icon={<FolderOpen className="h-6 w-6" />}
            title="조회할 과정·기수를 선택하세요"
            description="등록된 과정이 없으면 ‘교육 과정 추가’에서 먼저 등록해 주세요."
          />
        ) : tab === 'description' ? (
          <DescriptionPane courseId={courseId} cohortId={cohortId} />
        ) : (
          <ModulesPane />
        )}
      </div>
    </div>
  )
}
