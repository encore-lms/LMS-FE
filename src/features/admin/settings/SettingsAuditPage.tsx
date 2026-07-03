import { useMemo, useState } from 'react'
import { ArrowLeft, Clock, Download, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { Pagination } from '@/components/data/Pagination'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useSettingsAudit } from '../api/settings'
import type {
  SettingsAuditCategory,
  SettingsAuditEvent,
  SettingsAuditResult,
} from './settingsAudit.types'

const RESULT_META: Record<
  SettingsAuditResult,
  { label: string; tone: BadgeTone }
> = {
  success: { label: '성공', tone: 'success' },
  failure: { label: '실패', tone: 'danger' },
}

// 필터 칩 — 출처 분류. 다중 토글: 선택 없음=전체, 선택 시 해당 분류만.
const CHIPS: { key: SettingsAuditCategory; label: string }[] = [
  { key: 'account', label: '계정 관리' },
  { key: 'hrd', label: 'HRD API Key' },
  { key: 'course', label: '교육 과정' },
]

// 설정 감사 로그 (/admin/settings/audit) — 운영(MANAGER/ADMIN). Figma 5190:11189.
// 계정 관리의 '최근 감사 로그 → 전체 로그'에서 진입. 설정 변경(계정·HRD·과정)의 불변 로그(읽기 전용).
// CSV 내보내기는 BE 계약(SettingsAuditLog) 미확정 → 토스트 + TODO.
export default function SettingsAuditPage() {
  const navigate = useNavigate()
  const toast = useToast()
  usePageHeader('운영 설정 · 감사 로그')
  const { data, isPending, isError, refetch } = useSettingsAudit()
  const [active, setActive] = useState<SettingsAuditCategory[]>([])
  const [page, setPage] = useState(1)

  const events = useMemo(() => data?.events ?? [], [data])
  const filtered = useMemo(
    () =>
      active.length === 0
        ? events
        : events.filter((e) => active.includes(e.category)),
    [events, active],
  )

  // 페이지네이션 — 감사 로그는 많이 쌓이므로 표가 길어지지 않도록.
  const AUDIT_PAGE_SIZE = 10
  const pageCount = Math.max(1, Math.ceil(filtered.length / AUDIT_PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice(
    (safePage - 1) * AUDIT_PAGE_SIZE,
    safePage * AUDIT_PAGE_SIZE,
  )

  const toggle = (key: SettingsAuditCategory) => {
    setPage(1)
    setActive((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  // 진짜 CSV 내보내기 — 현재 필터 결과를 CSV 파일로 다운로드(BOM 포함, Excel 한글 호환).
  const exportCsv = () => {
    const headers = ['시각', '작업자', '출처', '작업', '대상', '결과']
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [
      headers,
      ...filtered.map((e) => [
        e.at,
        e.actor,
        e.origin,
        e.action,
        e.target,
        RESULT_META[e.result].label,
      ]),
    ].map((row) => row.map(esc).join(','))
    const blob = new Blob(['﻿' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `설정-감사로그-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`감사 로그 ${filtered.length}건 CSV 내보내기`)
  }

  const columns: Column<SettingsAuditEvent>[] = [
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
      key: 'origin',
      header: '출처',
      className: 'w-36',
      cell: (e) => <StatusBadge label={e.origin} tone="neutral" />,
    },
    {
      key: 'action',
      header: '작업',
      cell: (e) => <span className="text-fg text-[13px]">{e.action}</span>,
    },
    {
      key: 'target',
      header: '대상',
      cell: (e) => (
        <span className="text-fg-muted text-[13px] break-all">{e.target}</span>
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
  ]

  return (
    <div className="p-8">
      {/* 히어로 — 요약 수치가 응답에 의존하므로 데이터가 있을 때만 렌더(뒤로/필터 툴바는 항상 유지). */}
      {data && (
        <div className="bg-brand text-on-color mt-4 rounded-xl px-6 py-5">
          <p className="text-on-color/60 text-[11px] font-semibold tracking-wider">
            SETTINGS AUDIT · 설정 감사 로그
          </p>
          <h2 className="mt-1 text-xl font-bold">설정 변경 감사 로그</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="bg-surface/15 rounded-full px-2.5 py-1 text-xs">
              총 변경 {data.summary.total}
            </span>
            <span className="bg-surface/15 rounded-full px-2.5 py-1 text-xs">
              최근 30일
            </span>
            <span className="bg-surface/15 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
              <ShieldCheck className="h-3 w-3" /> 불변 로그
            </span>
          </div>
        </div>
      )}

      {/* 뒤로 + 분류 필터 + CSV */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/settings')}
            className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[13px] font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 설정
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
          onClick={exportCsv}
          className="bg-accent-bg text-accent hover:bg-accent-bg/70 inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold transition-colors"
        >
          <Download className="h-4 w-4" />
          CSV 내보내기
        </button>
      </div>

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={refetch}
        errorTitle="감사 로그를 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {data && (
          <>
            {/* KPI 5종 */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <KpiCard
                label="총 변경"
                value={data.summary.total}
                hint={data.summary.totalHint}
              />
              <KpiCard
                label="계정·권한"
                value={data.summary.accounts}
                hint={data.summary.accountsHint}
              />
              <KpiCard
                label="HRD Key"
                value={data.summary.hrdKey}
                hint={data.summary.hrdKeyHint}
              />
              <KpiCard
                label="과정 설정"
                value={data.summary.courseConfig}
                hint={data.summary.courseConfigHint}
              />
              <KpiCard
                label="보안 이벤트"
                value={data.summary.security}
                tone={data.summary.security > 0 ? 'warning' : 'default'}
                hint={data.summary.securityHint}
              />
            </div>

            {/* 감사 로그 표 */}
            <div className="mt-5">
              <DataTable
                columns={columns}
                rows={paged}
                rowKey={(e) => e.id}
                empty="조건에 맞는 이벤트가 없어요"
              />
              {filtered.length > 0 && (
                <div className="mt-3">
                  <Pagination
                    page={safePage}
                    pageCount={pageCount}
                    totalCount={filtered.length}
                    shownCount={paged.length}
                    onPage={setPage}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </DataBoundary>

      {/* 보존 기준 안내 */}
      <div className="border-border bg-surface-muted/50 mt-6 rounded-xl border p-5">
        <p className="text-fg flex items-center gap-1.5 text-base font-bold">
          <Clock className="h-4 w-4" /> 감사 로그 보존 기준
        </p>
        <p className="text-fg-muted mt-2 text-[13px] leading-relaxed">
          계정 생성·역할 변경·비활성화, HRD Key 등록·교체·폐기, 과정 기능
          토글·정책 변경은 모두 불변 로그로 저장합니다. 운영자는 필터와
          내보내기로 이력을 확인하지만 원본 이벤트는 수정할 수 없습니다.
        </p>
        <p className="text-fg-subtle mt-3 text-[13px]">
          연결 데이터: SettingsAuditLog · User · RoleAssignment · HrdApiKey ·
          CourseFeatureConfig
        </p>
      </div>
    </div>
  )
}
