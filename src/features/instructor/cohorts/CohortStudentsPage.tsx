import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { CohortStudentRow, StudentCertStatus } from '@/shared/types'
import { useCohortStudents } from '../api/console'
import { CERT_STATUS_META } from './meta'

type CertFilter = 'all' | StudentCertStatus
type RiskFilter = 'all' | 'risky'

// 수강생 목록 (/instructor/cohorts/:cohortId/students) — §3/P0 36. (Figma 1330:9675)
// 담당 기수 밖 학생 미노출 정책 · 정렬 기본 = 위험 많은 순.
export default function CohortStudentsPage() {
  const { cohortId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useCohortStudents(cohortId)
  const [q, setQ] = useState('')
  const [cert, setCert] = useState<CertFilter>('all')
  const [risk, setRisk] = useState<RiskFilter>('all')
  usePageHeader(
    data ? `수강생 목록 — ${data.cohortLabel}` : '수강생 목록',
    '담당 기수 수강생 조회 · 위험/보완 플래그가 있는 학생 빠르게 식별',
  )

  const filtered = useMemo(() => {
    const items = data?.rows ?? []
    const needle = q.trim().toLowerCase()
    const result = items.filter((r) => {
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
  }, [data, q, cert, risk])

  if (isPending) {
    return <div className="text-fg-muted p-8">수강생 목록을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="수강생 목록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

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
        <button
          type="button"
          onClick={() => navigate('/instructor/cohorts')}
          className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          기수: {data.cohortLabel}
        </button>
        <label className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
          <span className="text-fg-subtle">증명서</span>
          <select
            value={cert}
            onChange={(e) => setCert(e.target.value as CertFilter)}
            aria-label="증명서 상태 필터"
            className="text-fg bg-transparent text-sm font-medium outline-none"
          >
            <option value="all">전체</option>
            {(Object.keys(CERT_STATUS_META) as StudentCertStatus[]).map((s) => (
              <option key={s} value={s}>
                {CERT_STATUS_META[s].label}
              </option>
            ))}
          </select>
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
          정렬: 위험 많은 순 · {data.cohortLabel} {data.total}명
        </span>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          empty="조건에 맞는 수강생이 없어요"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-fg-subtle text-xs">
          {data.cohortLabel} {data.total}명 · 표시 {filtered.length}명 · 위험
          플래그 {data.riskTotal}건 — 담당 기수 밖 학생은 노출되지 않습니다
        </p>
        {/* 페이지네이션 — mock은 1페이지 데이터만, 표시는 Figma(1~5) 정합 */}
        <div className="ml-auto flex gap-1">
          {['‹', '1', '2', '3', '4', '5', '›'].map((p) => (
            <button
              key={p}
              type="button"
              className={cn(
                'h-7 min-w-7 rounded-md px-2 text-xs font-medium',
                p === '1'
                  ? 'bg-brand-deep text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
