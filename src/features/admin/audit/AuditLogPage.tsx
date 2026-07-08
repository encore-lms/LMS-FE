import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Download } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useAuditLog } from './api'
import type { AuditCategory, AuditEvent, AuditResult } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'

const RESULT_META: Record<AuditResult, { label: string; tone: BadgeTone }> = {
  success: { label: '성공', tone: 'success' },
  failure: { label: '실패', tone: 'danger' },
  warning: { label: '경고', tone: 'warning' },
}

// 필터 칩 — Figma의 인증/보완/공개. 다중 토글: 선택 없음=전체, 선택 시 해당 분류만.
type ChipKey = Extract<AuditCategory, 'auth' | 'supplement' | 'public'>
const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'auth', label: '인증' },
  { key: 'supplement', label: '보완' },
  { key: 'public', label: '공개' },
]

// 감사 로그 (/admin/certificates/:certificateId/audit) — 운영(MANAGER/ADMIN).
// Figma 1521:11112. 증명서 인증·보완·공개·마트·보안 이벤트의 불변 로그(읽기 전용).
// 진입: 증명서 스냅샷 상세의 '감사 로그' 링크(SnapshotPage는 팀 소유 → 별도 조율).
// CSV 내보내기는 BE 계약(CertificateAuditLog) 미확정 → 토스트 + TODO.
export default function AuditLogPage() {
  const { certificateId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  usePageHeader(
    '감사 로그',
    '증명서 인증·보완·공개 등 주요 처리 이력을 확인합니다',
  )
  const { data, isPending, isError, refetch } = useAuditLog(certificateId)
  const [active, setActive] = useState<ChipKey[]>([])

  const events = useMemo(() => data?.events ?? [], [data])
  const filtered = useMemo(
    () =>
      active.length === 0
        ? events
        : events.filter((e) => active.includes(e.category as ChipKey)),
    [events, active],
  )

  if (isPending) {
    return <SkeletonListPage kpis={4} columns={6} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="감사 로그를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { summary } = data
  const toggle = (key: ChipKey) =>
    setActive((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  const columns: Column<AuditEvent>[] = [
    {
      key: 'at',
      header: '시각',
      className: 'w-32',
      cell: (e) => (
        <span className="text-fg text-[13px] font-semibold whitespace-nowrap">
          {e.at}
        </span>
      ),
    },
    {
      key: 'actor',
      header: '작업자',
      className: 'w-28',
      cell: (e) => <span className="text-fg text-[13px]">{e.actor}</span>,
    },
    {
      key: 'event',
      header: '이벤트',
      cell: (e) => <span className="text-fg text-[13px]">{e.event}</span>,
    },
    {
      key: 'target',
      header: '대상',
      cell: (e) => (
        <span className="text-fg-muted font-mono text-[12px] break-all">
          {e.target}
        </span>
      ),
    },
    {
      key: 'result',
      header: '결과',
      className: 'w-24',
      cell: (e) => (
        <StatusBadge
          label={RESULT_META[e.result].label}
          tone={RESULT_META[e.result].tone}
        />
      ),
    },
    {
      key: 'basis',
      header: '근거',
      className: 'w-32',
      cell: (e) => <span className="text-fg-muted text-[13px]">{e.basis}</span>,
    },
  ]

  return (
    <div className="p-8">
      {/* 스냅샷 복귀 + 분류 필터 + CSV 내보내기 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              navigate(`/admin/certificates/${certificateId}/snapshot`)
            }
            className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[13px] font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 스냅샷
          </button>
          <div className="bg-border mx-1 h-5 w-px" />
          {CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => toggle(c.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors',
                active.includes(c.key)
                  ? 'bg-brand text-on-color'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          // TODO: 감사 로그 CSV 내보내기(CertificateAuditLog 계약 확정 후)
          onClick={() => toast.info('감사 로그 CSV 내보내기는 준비 중입니다.')}
          className="bg-accent-bg text-accent hover:bg-accent-bg/70 inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold transition-colors"
        >
          <Download className="h-4 w-4" />
          CSV 내보내기
        </button>
      </div>

      {/* KPI 5종 */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="총 이벤트"
          value={summary.total}
          hint={summary.totalHint}
        />
        <KpiCard
          label="검토 액션"
          value={summary.reviewActions}
          hint={summary.reviewHint}
        />
        <KpiCard
          label="공개 변경"
          value={summary.publicChanges}
          hint={summary.publicHint}
        />
        <KpiCard
          label="마트 작업"
          value={summary.martJobs}
          hint={summary.martHint}
        />
        <KpiCard
          label="보안 이벤트"
          value={summary.securityEvents}
          hint={summary.securityHint}
        />
      </div>

      {/* 감사 로그 표 */}
      <div className="mt-5">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(e) => e.id}
          empty="조건에 맞는 이벤트가 없어요"
        />
      </div>

      {/* 보존 기준 안내 */}
      <div className="border-border bg-surface-muted/50 mt-6 rounded-xl border p-5">
        <p className="text-fg text-base font-bold">감사 로그 보존 기준</p>
        <p className="text-fg-muted mt-2 text-[13px] leading-relaxed">
          인증 요청, 보완, 승인, 공개 토글, PDF 내보내기, 마트 재계산은 모두
          불변 로그로 저장합니다. 운영자는 필터와 내보내기로 이력을 확인하지만
          원본 이벤트는 수정할 수 없습니다.
        </p>
        <p className="text-fg-subtle mt-3 text-[13px]">
          연결 데이터: CertificateAuditLog · MartJobStatus · CertificateSnapshot
          · User
        </p>
      </div>
    </div>
  )
}
