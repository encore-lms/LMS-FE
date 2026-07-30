import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CohortDirectory } from '@/components/data/CohortDirectory'
import {
  cohortColumns,
  type CohortDirectoryRow,
} from '@/components/data/cohortColumns'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
import { useAdminCohorts } from './cohortRows'

// 담당 과정/기수 (/admin/education) — 기수를 골라 허브로 들어가는 1단계 화면.
// 예전에는 한 화면에서 과정·기수 드롭다운을 갈아 끼워, 지금 어느 기수를 보고 있는지 드러나지
// 않고 기수끼리 비교도 안 됐다. 강사 화면과 같은 골격·같은 컬럼을 쓴다.

type StatusFilter = 'operating' | 'upcoming' | 'ended'

export default function CohortListPage() {
  const navigate = useNavigate()
  usePageHeader(
    '담당 과정/기수',
    '과정과 기수를 선택해 학습 자료와 활동을 관리합니다',
  )

  const { data, isPending, isError, refetch } = useAdminCohorts()

  const [statusParam, setStatus] = useSearchParamState('status', 'operating')
  const status = statusParam as StatusFilter
  const [q, setQ] = useSearchParamState('q')

  const rows: CohortDirectoryRow[] = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data?.rows ?? [])
      .filter((r) => r.status === status)
      .filter(
        (r) =>
          !needle || `${r.name} ${r.subtitle}`.toLowerCase().includes(needle),
      )
      .map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: r.subtitle,
        period: r.period,
        dday: r.dday,
        // 강사 화면의 역할 배지 자리 — 운영자에게 필요한 건 자기 역할이 아니라 누가 맡은 기수인지다.
        lead:
          r.instructors.length > 0 ? (
            <span className="text-fg text-sm">{r.instructors.join(', ')}</span>
          ) : (
            <span className="text-fg-subtle text-sm">-</span>
          ),
        students: r.students,
        evalSummary: r.evalSummary,
        evalPending: r.evalPending,
        reviewSummary: r.reviewSummary,
        reviewPending: r.reviewPending,
      }))
  }, [data, status, q])

  const summary = data?.summary

  return (
    <CohortDirectory<CohortDirectoryRow, StatusFilter>
      tabs={[
        { key: 'operating', label: '진행 중', count: data?.operating ?? 0 },
        { key: 'upcoming', label: '예정', count: data?.upcoming ?? 0 },
        { key: 'ended', label: '종료', count: data?.ended ?? 0 },
      ]}
      status={status}
      onStatusChange={setStatus}
      q={q}
      onQChange={setQ}
      scopeSummary={
        data
          ? `전체 ${data.total}개 (진행 중 ${data.operating} · 예정 ${data.upcoming} · 종료 ${data.ended})`
          : undefined
      }
      cards={
        summary
          ? [
              {
                label: '진행 중 기수',
                value: summary.operatingCourses.value,
                unit: '개',
                hint: summary.operatingCourses.hint,
                dot: 'bg-info',
              },
              {
                label: '수강생',
                value: summary.students.value,
                unit: '명',
                hint: summary.students.hint,
                dot: 'bg-accent',
              },
              {
                label: '채점 대기',
                value: summary.gradingPending.value,
                unit: '건',
                hint: summary.gradingPending.hint,
                dot: 'bg-warning',
                hintColor: 'text-warning',
              },
              {
                label: '검토 대기',
                value: summary.reviewPending.value,
                unit: '건',
                hint: summary.reviewPending.hint,
                dot: 'bg-info',
              },
            ]
          : []
      }
      columns={cohortColumns<CohortDirectoryRow>('담당 강사')}
      rows={rows}
      rowKey={(r) => r.id}
      onRowClick={(r) => navigate(`/admin/education/${r.id}`)}
      emptyText="조건에 맞는 기수가 없어요"
      footnote="기수를 클릭하면 과정 홈·수강생·기록실·퀴즈·프로젝트·과제·이력서·멘토링·QnA·자료실·설정을 한 곳에서 확인"
      isPending={isPending}
      isError={isError}
      onRetry={refetch}
    />
  )
}
