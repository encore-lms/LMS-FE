import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Pagination } from '@/components/data/Pagination'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { CohortStudentRow, StudentCertStatus } from '@/shared/types'
import { useCohortStudents } from '../api/console'
import { useCohortContext, COHORT_ID_TO_LABEL } from '../cohortContext'
import { CERT_STATUS_META } from './meta'
import { SkeletonListPage } from '@/components/ui/Skeleton'

type CertFilter = 'all' | StudentCertStatus
type RiskFilter = 'all' | 'risky'

// 수강생 목록 (/instructor/cohorts/:cohortId/students) — §3/P0 36. (Figma 1330:9675)
// 담당 기수 밖 학생 미노출 정책 · 정렬 기본 = 위험 많은 순.
export default function CohortStudentsPage() {
  const { cohortId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useCohortStudents(cohortId)
  // 선택 기수 — 대시보드와 공유하는 공용 컨텍스트로 필터(전체/DA 4기/FE 7기).
  const { cohortId: ctxCohortId, setCohortId } = useCohortContext()
  const cohortLabel = COHORT_ID_TO_LABEL[ctxCohortId] ?? '전체'
  const [q, setQ] = useState('')
  const [cert, setCert] = useState<CertFilter>('all')
  const [risk, setRisk] = useState<RiskFilter>('all')
  const [page, setPage] = useState(1)
  usePageHeader(
    `수강생 목록 — ${cohortLabel}`,
    '담당 기수 수강생을 확인하고 관리가 필요한 학생을 파악합니다',
  )

  const filtered = useMemo(() => {
    const items = data?.rows ?? []
    const needle = q.trim().toLowerCase()
    const result = items.filter((r) => {
      if (cohortLabel !== '전체' && r.cohortLabel !== cohortLabel) return false
      if (cert !== 'all' && r.certStatus !== cert) return false
      if (risk === 'risky' && r.riskFlags.length === 0) return false
      if (needle) {
        const hay = `${r.name} ${r.emailUuid}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    // 기본 정렬 = 위험 플래그 많은 순.
    return [...result].sort((a, b) => b.riskFlags.length - a.riskFlags.length)
  }, [data, q, cert, risk, cohortLabel])

  // 필터/검색/기수 변경 시 첫 페이지로.
  useEffect(() => {
    setPage(1)
  }, [q, cert, risk, cohortLabel])

  // 클라이언트 페이지네이션 — 8명/페이지.
  const PAGE_SIZE = 8
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const columns: Column<CohortStudentRow>[] = [
    {
      key: 'student',
      header: '수강생',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">{r.name}</p>
          <p className="text-fg-subtle text-xs">{r.emailUuid}</p>
        </div>
      ),
    },
    {
      key: 'cohort',
      header: '과정/기수',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg-muted text-sm">{r.cohortLabel}</span>
      ),
    },
    {
      key: 'cert',
      header: '증명서 상태',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={CERT_STATUS_META[r.certStatus].label}
          tone={CERT_STATUS_META[r.certStatus].tone}
        />
      ),
    },
    {
      key: 'quiz',
      header: '퀴즈',
      className: 'w-36',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">{r.quizAvg}</p>
          <p className="text-fg-subtle text-xs">{r.quizDetail}</p>
        </div>
      ),
    },
    {
      key: 'record',
      header: '기록실',
      className: 'w-32',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">{r.recordApproved}</p>
          <p className="text-fg-subtle text-xs">{r.recordDetail}</p>
        </div>
      ),
    },
    {
      key: 'project',
      header: '프로젝트',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={CERT_STATUS_META[r.projectStatus].label}
          tone={CERT_STATUS_META[r.projectStatus].tone}
        />
      ),
    },
    {
      key: 'risk',
      header: '위험 플래그',
      className: 'w-44',
      cell: (r) =>
        r.riskFlags.length === 0 ? (
          <span className="text-fg-subtle text-sm">— 없음</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.riskFlags.map((flag) => (
              <span
                key={flag}
                className="bg-danger-bg text-danger rounded px-1.5 py-0.5 text-[11px] font-bold"
              >
                {flag}
              </span>
            ))}
          </div>
        ),
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonListPage columns={5} className="" />}
      errorTitle="수강생 목록을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="p-8">
          {/* 필터 바 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="border-border flex h-9 w-72 items-center gap-2 rounded-lg border bg-white px-3">
              <Search className="text-fg-subtle h-4 w-4" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="이름·이메일로 검색"
                aria-label="수강생 검색"
                className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none"
              />
            </div>
            <label className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
              <span className="text-fg-subtle">기수</span>
              <Select
                value={ctxCohortId}
                onChange={(v) => setCohortId(v)}
                aria-label="기수 필터"
                options={Object.entries(COHORT_ID_TO_LABEL).map(
                  ([id, label]) => ({
                    value: id,
                    label,
                  }),
                )}
              />
            </label>
            <label className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
              <span className="text-fg-subtle">증명서</span>
              <Select
                value={cert}
                onChange={(v) => setCert(v as CertFilter)}
                aria-label="증명서 상태 필터"
                options={[
                  { value: 'all', label: '전체' },
                  ...(Object.keys(CERT_STATUS_META) as StudentCertStatus[]).map(
                    (s) => ({ value: s, label: CERT_STATUS_META[s].label }),
                  ),
                ]}
              />
            </label>
            <button
              type="button"
              onClick={() => setRisk((v) => (v === 'all' ? 'risky' : 'all'))}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium',
                risk === 'risky'
                  ? 'border-danger/40 bg-danger-bg text-danger'
                  : 'border-border text-fg-muted hover:bg-surface-muted',
              )}
            >
              위험: {risk === 'risky' ? '플래그 있음' : '전체'}
            </button>
            <span className="text-fg-subtle ml-auto text-xs">
              정렬: 위험 많은 순 · {cohortLabel} {filtered.length}명
            </span>
          </div>

          <div className="mt-4">
            <DataTable
              columns={columns}
              rows={paged}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`/instructor/students/${r.id}`)}
              empty="조건에 맞는 수강생이 없어요"
            />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Pagination
              page={current}
              pageCount={pageCount}
              totalCount={filtered.length}
              shownCount={paged.length}
              onPage={setPage}
            />
            <p className="text-fg-subtle text-xs">
              {cohortLabel} · 담당 기수 밖 학생은 노출되지 않습니다
            </p>
          </div>
        </div>
      )}
    </DataBoundary>
  )
}
