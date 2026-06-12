import { useMemo, useState } from 'react'
import { AlertTriangle, Clock, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useAdminMentoringLogDetail, useAdminMentoringLogs } from './api'
import { LOG_STATUS_META, logDisplayStatus } from './statusMeta'
import { LogDetailPanel } from './LogDetailPanel'
import { ChangeRequestModal } from './ChangeRequestModal'
import type { AdminMentoringLogRow, AdminMentoringLogStatus } from './types'

type StatusFilter = 'all' | AdminMentoringLogStatus

// 멘토링 일지 관리 (/admin/mentoring/logs) — 운영(MANAGER/ADMIN) 조회·수정 요청 전용.
// 직접 수정·폐기·반려 없음(05-31 확정 — Figma 2745:7815 의 반려 KPI·버튼은 정책 확정 전
// 시안이라 제외, 상태 = 초안/유효/수정 요청/재제출 후 유효로 정합).
export default function LogsPage() {
  usePageHeader(
    '멘토링 일지 관리',
    '운영자 조회·수정 요청 · 직접 수정 불가 · 최종 유효본 기준 인정 시간 계산',
  )
  const { data, isPending, isError, refetch } = useAdminMentoringLogs()
  const [team, setTeam] = useState('all')
  const [mentor, setMentor] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [changeRequestOpen, setChangeRequestOpen] = useState(false)

  const rows = useMemo(() => data?.rows ?? [], [data])
  const teams = useMemo(() => [...new Set(rows.map((r) => r.teamName))], [rows])
  const mentors = useMemo(
    () => [...new Set(rows.map((r) => r.mentorName))],
    [rows],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (team !== 'all' && r.teamName !== team) return false
      if (mentor !== 'all' && r.mentorName !== mentor) return false
      if (status !== 'all' && r.status !== status) return false
      if (needle) {
        const hay = `${r.teamName} ${r.mentorName}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [rows, team, mentor, status, q])

  const selected =
    filtered.find((r) => r.logId === selectedId) ?? filtered[0] ?? null
  const detailQuery = useAdminMentoringLogDetail(selected?.logId ?? null)

  if (isPending) {
    return <div className="text-fg-muted p-8">일지 목록을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="일지 목록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const columns: Column<AdminMentoringLogRow>[] = [
    {
      key: 'team',
      header: '팀명',
      cell: (r) => (
        <span className="text-fg text-xs font-bold">{r.teamName}</span>
      ),
    },
    {
      key: 'mentor',
      header: '멘토',
      className: 'w-28',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Avatar name={r.mentorName} size={26} />
          <span className="text-fg text-xs font-bold">{r.mentorName}</span>
        </div>
      ),
    },
    {
      key: 'performedAt',
      header: '진행 일시',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg-muted text-xs font-medium whitespace-nowrap">
          {r.performedAtLabel}
        </span>
      ),
    },
    {
      key: 'actual',
      header: '실제',
      className: 'w-16',
      cell: (r) => (
        <span className="text-fg text-xs font-bold">{r.actualMinutes}분</span>
      ),
    },
    {
      key: 'recognized',
      header: '인정',
      className: 'w-14',
      cell: (r) =>
        r.recognizedHours !== null ? (
          <span className="text-brand text-xs font-bold">
            {r.recognizedHours}h
          </span>
        ) : (
          <span className="text-fg-subtle">-</span>
        ),
    },
    {
      key: 'excess',
      header: '초과',
      className: 'w-12',
      cell: (r) =>
        r.excessHours > 0 ? (
          <span className="text-warning text-xs font-bold">
            {r.excessHours}h
          </span>
        ) : (
          <span className="text-fg-subtle">-</span>
        ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (r) => {
        const meta = LOG_STATUS_META[logDisplayStatus(r)]
        return <StatusBadge label={meta.label} tone={meta.tone} />
      },
    },
  ]

  return (
    <div className="p-8">
      {/* Hero — CTA 없음. 잠금 안내 + 제출·처리 대기 칩 */}
      <div className="bg-brand flex flex-wrap items-center justify-between gap-4 rounded-2xl px-7 py-6 shadow-[0_8px_22px_rgba(18,23,38,0.18)]">
        <div className="flex flex-col gap-3">
          <p className="text-on-color text-lg font-bold">
            멘토링 일지 조회 · 수정 요청 · 최종 유효본 기준 인정 시간 계산
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-surface text-fg rounded-md px-2.5 py-1 text-[11px] font-bold">
              이번 달 제출 {data.monthlySubmitted}
            </span>
            {data.pendingCount > 0 && (
              <span className="bg-warning-bg text-warning inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold">
                <Clock className="h-3 w-3" />
                처리 대기 {data.pendingCount}건
              </span>
            )}
          </div>
        </div>
        <span className="bg-surface/15 text-on-color inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold">
          <Lock className="h-3 w-3" />
          운영자 직접 수정 불가 · 수정 요청만
        </span>
      </div>

      {/* KPI 4 — 반려 없음(05-31) — 유효·수정 요청·초안·재제출 후 유효 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="유효"
          value={data.kpis.valid}
          tone="success"
          hint="이번 달 인정 시간 산입"
        />
        <KpiCard
          label="수정 요청"
          value={data.kpis.changeRequested}
          tone="info"
          hint="재제출 대기"
        />
        <KpiCard
          label="초안"
          value={data.kpis.draft}
          hint="작성 중 · 인정 시간 미반영"
        />
        <KpiCard
          label="재제출 후 유효"
          value={data.kpis.resubmitted}
          tone="accent"
          hint="이번 달 재제출 처리"
        />
      </div>

      {/* 필터 바 */}
      <div className="border-border bg-surface mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            aria-label="팀 필터"
            className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
          >
            <option value="all">팀 전체</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={mentor}
            onChange={(e) => setMentor(e.target.value)}
            aria-label="멘토 필터"
            className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
          >
            <option value="all">멘토 전체</option>
            {mentors.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            aria-label="상태 필터"
            className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
          >
            <option value="all">상태 전체</option>
            <option value="valid">유효</option>
            <option value="change_requested">수정 요청</option>
            <option value="draft">초안</option>
          </select>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="팀·멘토 검색"
          aria-label="팀·멘토 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-56 rounded-lg border bg-white px-3 text-sm outline-none"
        />
      </div>

      {/* 2단 — 좌 테이블 + 우 상세 패널 */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.logId}
            onRowClick={(r) => setSelectedId(r.logId)}
            rowClassName={(r) =>
              cn(
                r.logId === selected?.logId &&
                  'border-l-4 border-l-brand bg-brand/10',
              )
            }
            empty="조건에 맞는 일지가 없어요"
          />
          <div className="text-fg-subtle mt-3 flex items-center justify-between text-xs">
            <span>
              총 {rows.length} · 유효 {data.kpis.valid} · 수정 요청{' '}
              {data.kpis.changeRequested} · 초안 {data.kpis.draft} · 재제출{' '}
              {data.kpis.resubmitted}
            </span>
            <span className="bg-surface-muted text-fg-muted rounded-md px-2.5 py-1 font-bold">
              1 / 1
            </span>
          </div>
        </div>

        <LogDetailPanel
          detail={detailQuery.data ?? null}
          isPending={!!selected && detailQuery.isPending}
          onRequestChange={() => setChangeRequestOpen(true)}
        />
      </div>

      {/* 일지 관리 정책 · §30 완료 기준 — 05-31 확정(반려 제거) 반영 */}
      <div className="bg-info-bg border-info/30 mt-8 rounded-xl border p-5">
        <p className="text-fg text-sm font-bold">
          일지 관리 정책 · §30 완료 기준
        </p>
        <ul className="text-fg-muted mt-2 flex flex-col gap-1 text-xs">
          <li>
            • 운영자는 일지를 직접 수정하지 않음 — 수정 요청만 가능 (폐기·반려
            없음)
          </li>
          <li>
            • 수정 요청 시 사유 코멘트 필수 — 이력에 보존되며 멘토에게 알림 발송
          </li>
          <li>
            • 최종 유효본(status = 유효) 기준으로 인정 시간이 계산됨 · 수정 요청
            중에는 기존 유효본 인정 유지
          </li>
        </ul>
      </div>

      {changeRequestOpen && detailQuery.data && (
        <ChangeRequestModal
          open
          onClose={() => setChangeRequestOpen(false)}
          detail={detailQuery.data}
        />
      )}
    </div>
  )
}
