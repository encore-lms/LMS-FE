import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { Select } from '@/components/ui/Select'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
import { useStudentAccounts } from '@/shared/api'
import { useCourseConfig, useCourseList } from '../api/settings'
import { useCertReviewList } from './api'
import { readLastCohort, writeLastCohort } from '../education/lastCohort'
import { toCertRow } from './mocks'
import {
  REVIEW_STATUSES,
  type CompetencyCertRow,
  type CompetencyCertStatus,
} from './types'
import { TERMS } from '@/shared/constants'
import { SearchInput } from '@/components/ui/SearchInput'

// 역량 증명서 관리 (/admin/certificates) — 과정·기수별 수강생 증명서 현황.
// 명단은 실제 로스터, 증명서 값은 아직 목데이터(BE 연동은 후속).

const STATUS_META: Record<
  CompetencyCertStatus,
  { label: string; tone: BadgeTone }
> = {
  cohort_open: { label: '기수 미종료', tone: 'neutral' },
  data_pending: { label: '데이터 미준비', tone: 'warning' },
  data_ready: { label: '데이터 준비', tone: 'info' },
  requested: { label: '인증 요청', tone: 'warning' },
  reviewing: { label: '검토 중', tone: 'info' },
  changes_requested: { label: '보완 요청', tone: 'warning' },
  certified: { label: '인증 완료', tone: 'success' },
}

export default function CompetencyCertificatesPage() {
  usePageHeader(
    TERMS.certificate,
    `${TERMS.educationCourse}별 수강생의 역량 증명서를 확인하고 공개를 관리합니다`,
  )

  const navigate = useNavigate()
  const { data: courses } = useCourseList()
  // 과정·기수를 URL 에 둔다 — 새로고침·상세 왕복에서 보던 기수가 유지된다.
  const [courseParam, setCourseParam] = useSearchParamState('course')
  const courseId = courseParam || courses?.[0]?.courseId || null
  const { data: courseConfig } = useCourseConfig(courseId)
  const [cohortParam, setCohortParam] = useSearchParamState('cohort')
  const cohorts = useMemo(() => courseConfig?.cohorts ?? [], [courseConfig])

  // 기본 기수: 지난번에 본 기수 → 내가 담당하는 기수 → 목록 첫 기수.
  // 목록 첫 행은 최신 기수라 아직 수강생이 없는 경우가 많다.
  const remembered = readLastCohort(courseId)
  const defaultCohortId =
    (remembered && cohorts.some((c) => c.id === remembered)
      ? remembered
      : null) ??
    cohorts.find((c) => c.assigned)?.id ??
    cohorts[0]?.id ??
    null
  const cohortId = cohortParam || defaultCohortId

  useEffect(() => {
    if (courseId && cohortId) writeLastCohort(courseId, cohortId)
  }, [courseId, cohortId])

  const [q, setQ] = useSearchParamState('q')
  const { data, isPending, isError, refetch } = useStudentAccounts(cohortId)
  // 심사 상태는 서버가 정본 — 행이 없는 수강생은 아직 증명서를 연 적이 없다는 뜻이라
  // 로스터 기준 기본값을 그대로 쓴다(2026-08-07, 예전엔 학생 id 해시로 만든 데모였다).
  const { data: reviewRows } = useCertReviewList(cohortId)

  const cohortLabel = useMemo(() => {
    const found = cohorts.find((c) => c.id === cohortId)
    return found ? `${found.cohortNo}기` : ''
  }, [cohorts, cohortId])

  const rows = useMemo(() => {
    const items = data?.items ?? []
    const needle = q.trim().toLowerCase()
    return (
      items
        // 시연용 테스트 계정은 증명서 대상이 아니다.
        .filter((s) => !s.isTest)
        .map((s) => {
          const row = toCertRow(s, cohortLabel)
          const served = reviewRows?.find((r) => r.studentUserId === s.id)
          if (!served) return row
          // 서버 심사 행이 정본 — 상태에 맞춰 점수·공개도 다시 계산한다.
          const ready =
            served.status !== 'cohort_open' && served.status !== 'data_pending'
          return {
            ...row,
            status: served.status,
            openable: ready,
            overallScore: ready ? row.demoOverallScore : null,
            published: served.published ?? false,
          }
        })
        .filter(
          (r) =>
            !needle ||
            r.studentName.toLowerCase().includes(needle) ||
            r.studentUuid.toLowerCase().includes(needle),
        )
        // 이름 가나다 오름차순 — 로스터 순서가 뒤섞여 있어 시연 때 찾기 어려웠다(2026-08-11).
        .sort((a, b) => a.studentName.localeCompare(b.studentName, 'ko'))
    )
  }, [data, q, cohortLabel, reviewRows])

  const summary = useMemo(() => {
    const by = (s: CompetencyCertStatus) =>
      rows.filter((r) => r.status === s).length
    return {
      total: rows.length,
      certified: by('certified'),
      // 운영자가 지금 손댈 건 — 인증 요청·검토 중·보완 요청을 한 숫자로 본다.
      review: REVIEW_STATUSES.reduce((n, st) => n + by(st), 0),
      published: rows.filter((r) => r.published).length,
    }
  }, [rows])

  const columns: Column<CompetencyCertRow>[] = [
    {
      key: 'studentName',
      header: '수강생',
      cell: (r: CompetencyCertRow) => (
        <div className="flex flex-col">
          <span className="text-fg text-[13px] font-semibold">
            {r.studentName}
          </span>
          <span className="text-fg-subtle text-[11px]">{r.studentUuid}</span>
        </div>
      ),
    },
    {
      key: 'cohortLabel',
      header: '기수',
      cell: (r: CompetencyCertRow) => r.cohortLabel,
    },
    {
      key: 'status',
      header: '증명서 상태',
      cell: (r: CompetencyCertRow) => (
        <StatusBadge
          tone={STATUS_META[r.status].tone}
          label={STATUS_META[r.status].label}
        />
      ),
    },
    {
      key: 'overallScore',
      header: '종합 점수',
      cell: (r: CompetencyCertRow) =>
        r.overallScore === null ? (
          <span className="text-fg-subtle text-[13px]">—</span>
        ) : (
          <span className="text-fg text-[13px] font-semibold tabular-nums">
            {r.overallScore}
          </span>
        ),
    },
    {
      key: 'published',
      header: '공개',
      cell: (r: CompetencyCertRow) =>
        r.published ? (
          <StatusBadge tone="success" label="공개 중" />
        ) : (
          <span className="text-fg-subtle text-[12px]">비공개</span>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* 과정·기수 선택 — 담당 과정이 먼저 열린다. */}
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
          options={cohorts.map((c) => ({
            value: c.id,
            label: `${c.cohortNo}기`,
          }))}
          placeholder="기수 없음"
          className="h-11"
        />
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="이름·수강생 코드 검색"
          ariaLabel="수강생 검색"
          className="ml-auto w-64"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="대상 수강생" value={`${summary.total}명`} />
        <KpiCard
          label="검토 대기"
          value={`${summary.review}명`}
          tone="warning"
        />
        <KpiCard
          label="인증 완료"
          value={`${summary.certified}명`}
          tone="success"
        />
        <KpiCard label="공개 중" value={`${summary.published}명`} tone="info" />
      </div>

      <DataBoundary
        isPending={isPending}
        isError={isError}
        onRetry={refetch}
        skeleton={<SkeletonListPage columns={5} className="" />}
        errorTitle="수강생 명단을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {rows.length === 0 ? (
          <Empty
            icon={<Award aria-hidden="true" />}
            title={
              cohortId ? '이 기수에 수강생이 없어요' : '기수를 선택해 주세요'
            }
            description={
              cohortId
                ? 'HRD 계정 동기화 후 다시 확인해 주세요.'
                : '과정과 기수를 고르면 역량 증명서 현황이 보여요.'
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.studentId}
            // 증명서가 나온 건만 상세로 들어간다 — 준비 중인 행은 열어도 볼 게 없다.
            onRowClick={(r) =>
              r.openable &&
              navigate(
                `/admin/certificates/${r.studentId}?demo=${r.demoStudentId}&cohortId=${cohortId ?? ''}`,
              )
            }
            rowClassName={(r) =>
              r.openable ? 'cursor-pointer' : 'cursor-default'
            }
          />
        )}
      </DataBoundary>
    </div>
  )
}
