import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Download,
  Info,
  RotateCcw,
  Upload,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { ActionModal, type ActionModalSpec } from '../settings/ActionModal'
import { useIngestionAction, useIngestionQueue } from './api'
import type { IngestionSession, SessionStatus } from './types'

const STATUS_META: Record<SessionStatus, { label: string; tone: BadgeTone }> = {
  in_progress: { label: '진행 중', tone: 'info' },
  has_failure: { label: '실패 있음', tone: 'warning' },
  success: { label: '성공', tone: 'success' },
  discarded: { label: '폐기됨', tone: 'neutral' },
}

type StatusFilter = 'all' | SessionStatus
type Sort = 'failed' | 'recent'

// 인입 격리 큐 (/admin/ingestion/quarantine) — 운영(MANAGER/ADMIN) 신규.
// Figma 1185:6029. CSV 대량 인입 실패 행을 세션 단위로 추적·수정·재시도·폐기.
// 행 클릭 시 우측에 세션 상세(카테고리·실패 행·액션). 재시도·폐기·다운로드 흐름은
// 별도 시안 미설계 → 토스트 안내 + TODO. '새 CSV 인입'은 CSV 매핑 화면으로 라우팅.
export default function IngestionQueuePage() {
  usePageHeader('인입 격리 큐', 'CSV 대량 인입 실패 행 추적·수정·재시도')
  const { data, isPending, isError, refetch } = useIngestionQueue()
  const sessionAction = useIngestionAction()
  const toast = useToast()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [domain, setDomain] = useState<string>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<Sort>('failed')
  const [retryTarget, setRetryTarget] = useState<IngestionSession | null>(null)
  const [discardTarget, setDiscardTarget] = useState<IngestionSession | null>(
    null,
  )

  const sessions = useMemo(() => data?.sessions ?? [], [data])
  const domains = useMemo(
    () => [...new Set(sessions.map((s) => s.domain))],
    [sessions],
  )
  const filtered = useMemo(() => {
    const list = sessions.filter((s) => {
      if (domain !== 'all' && s.domain !== domain) return false
      if (status !== 'all' && s.status !== status) return false
      return true
    })
    return [...list].sort((a, b) =>
      sort === 'failed'
        ? b.failedRows - a.failedRows
        : b.at.localeCompare(a.at),
    )
  }, [sessions, domain, status, sort])

  if (isPending) {
    return <div className="text-fg-muted p-8">인입 세션을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="인입 세션을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { summary, details } = data
  const activeId = selectedId ?? sessions[0]?.id
  const detail = activeId ? details[activeId] : undefined

  // 재시도 확인 모달 — 운영 액션 모달 v2 공통 골격(ActionModal) 재사용.
  const retrySpec: ActionModalSpec | null = retryTarget
    ? {
        title: '세션 재시도',
        subtitle:
          '격리된 실패 행만 다시 인입합니다. 성공 행은 유지되며 결과는 세션 이력·감사 로그에 남습니다.',
        rows: [
          { label: '도메인', value: retryTarget.domain },
          { label: '대상 세션', value: retryTarget.at },
          { label: '실패 행', value: `${retryTarget.failedRows}건` },
          { label: '처리', value: '실패 행만 재인입 (성공 행 유지)' },
        ],
        confirmLabel: '재시도',
      }
    : null
  const handleRetry = (memo: string) => {
    if (!retryTarget) return
    const target = retryTarget
    sessionAction.mutate(
      { id: target.id, action: 'retry', memo },
      {
        onSuccess: () => {
          setRetryTarget(null)
          toast.success(
            `${target.domain} 재시도 요청을 보냈습니다 — 결과는 세션 이력에 반영됩니다.`,
          )
        },
        onError: () => {
          setRetryTarget(null)
          toast.danger('세션 재시도에 실패했어요. 잠시 후 다시 시도해 주세요.')
        },
      },
    )
  }

  // 결정적 폐기 확인 모달 — 운영 액션 모달 공통 골격 재사용.
  const discardSpec: ActionModalSpec | null = discardTarget
    ? {
        title: '세션 결정적 폐기',
        subtitle:
          '이 세션의 실패 행을 폐기합니다. 폐기 후에는 복구할 수 없습니다.',
        rows: [
          { label: '도메인', value: discardTarget.domain },
          { label: '대상 세션', value: discardTarget.at },
          { label: '실패 행', value: `${discardTarget.failedRows}건` },
          { label: '처리', value: '복구 불가 — 폐기 전 실패 행 다운로드 권장' },
        ],
        confirmLabel: '폐기',
      }
    : null
  const handleDiscard = (memo: string) => {
    if (!discardTarget) return
    const target = discardTarget
    sessionAction.mutate(
      { id: target.id, action: 'discard', memo },
      {
        onSuccess: () => {
          setDiscardTarget(null)
          toast.success(`${target.domain} 세션을 폐기했습니다.`)
        },
        onError: () => {
          setDiscardTarget(null)
          toast.danger('세션 폐기에 실패했어요. 잠시 후 다시 시도해 주세요.')
        },
      },
    )
  }

  const columns: Column<IngestionSession>[] = [
    {
      key: 'at',
      header: '일시',
      className: 'w-28',
      cell: (s) => (
        <span className="text-fg text-[13px] whitespace-nowrap">{s.at}</span>
      ),
    },
    {
      key: 'domain',
      header: '도메인',
      cell: (s) => <StatusBadge label={s.domain} tone="neutral" />,
    },
    {
      key: 'rows',
      header: '성공/실패',
      className: 'w-28',
      cell: (s) => (
        <span className="text-[13px] tabular-nums">
          <span className="text-fg">{s.successRows.toLocaleString()}</span>
          <span className="text-fg-subtle"> / </span>
          <span
            className={cn(
              'font-semibold',
              s.failedRows > 0 ? 'text-danger' : 'text-fg-subtle',
            )}
          >
            {s.failedRows}
          </span>
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-24',
      cell: (s) => (
        <StatusBadge
          label={STATUS_META[s.status].label}
          tone={STATUS_META[s.status].tone}
        />
      ),
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-44',
      cell: (s) => {
        if (s.status === 'success') {
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedId(s.id)
              }}
              className="text-brand text-[13px] font-semibold hover:underline"
            >
              상세
            </button>
          )
        }
        if (s.status === 'discarded') {
          return <span className="text-fg-subtle text-[13px]">작업 불가</span>
        }
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setRetryTarget(s)
              }}
              className="text-brand inline-flex items-center gap-1 text-[13px] font-semibold hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              재시도
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedId(s.id)
              }}
              className="text-fg-muted hover:text-fg text-[13px] font-semibold"
            >
              실패 행
            </button>
            {s.status === 'has_failure' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDiscardTarget(s)
                }}
                className="text-danger text-[13px] font-semibold hover:underline"
              >
                폐기
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-8">
      {/* 히어로 배너 — 목적 + 핵심 액션 */}
      <div className="bg-brand flex flex-col gap-4 rounded-xl p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[17px] font-bold">
            CSV 대량 인입의 실패 행을 추적·수정·재시도합니다
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-white/75">
            <Info className="h-4 w-4" />
            출시 전 과거 수료생 백필 1순위
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            // TODO: 실패 행 일괄 CSV 추출(P0_20)
            onClick={() => toast.info('실패 행 일괄 다운로드는 준비 중입니다.')}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-white/15 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/25"
          >
            <Download className="h-4 w-4" />
            실패 행 일괄 다운로드
          </button>
          <button
            type="button"
            // 새 CSV 인입 — CSV 매핑·업로드 화면으로 이동
            onClick={() => navigate('/admin/csv-mapping')}
            className="bg-surface text-brand inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition-colors hover:bg-white/90"
          >
            <Upload className="h-4 w-4" />새 CSV 인입
          </button>
        </div>
      </div>

      {/* KPI 4종 */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="총 세션"
          value={summary.totalSessions}
          hint={summary.totalSessionsHint}
        />
        <KpiCard
          label="성공 행"
          value={summary.successRows.toLocaleString()}
          hint={summary.successRowsHint}
          tone="success"
        />
        <KpiCard
          label="실패 행 격리"
          value={summary.quarantinedRows}
          hint="재시도 대기 · 수정 필요"
          tone="danger"
        />
        <KpiCard
          label="진행 중"
          value={summary.inProgress}
          hint={summary.inProgressHint}
          tone="info"
        />
      </div>

      {/* 필터 */}
      <div className="border-border bg-surface mt-5 flex flex-wrap items-center gap-2 rounded-xl border p-3.5">
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          aria-label="도메인 필터"
          className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
        >
          <option value="all">도메인 전체</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
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
          {(Object.keys(STATUS_META) as SessionStatus[]).map((key) => (
            <option key={key} value={key}>
              {STATUS_META[key].label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="정렬"
          className="border-border text-fg-muted focus:border-brand ml-auto h-9 rounded-lg border bg-white px-3 text-sm outline-none"
        >
          <option value="failed">실패 많은 순</option>
          <option value="recent">최신 순</option>
        </select>
      </div>

      {/* 메인 — 세션 이력 표(좌) + 세션 상세 패널(우) */}
      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="text-fg-subtle mb-2 flex items-center justify-between text-xs">
            <span className="text-fg text-sm font-bold">세션 이력</span>
            <span>총 {sessions.length}건</span>
          </div>
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(s) => s.id}
            onRowClick={(s) => setSelectedId(s.id)}
            rowClassName={(s) => (s.id === activeId ? 'bg-surface-muted' : '')}
            empty="조건에 맞는 세션이 없어요"
          />
        </div>

        {/* 세션 상세 패널 */}
        <aside className="border-border bg-surface w-full rounded-xl border p-5 lg:w-[400px] lg:shrink-0">
          {detail ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-fg text-base font-bold">세션 상세</p>
                <StatusBadge
                  label={STATUS_META[detail.status].label}
                  tone={STATUS_META[detail.status].tone}
                />
              </div>
              <p className="text-fg-muted mt-1.5 text-xs">
                {detail.summaryLine}
              </p>

              {/* 카테고리별 실패 사유 */}
              {detail.categories.length > 0 && (
                <div className="mt-5">
                  <p className="text-fg text-xs font-semibold">
                    카테고리별 실패 사유
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {detail.categories.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2 text-[13px]"
                      >
                        <span className="text-fg-muted">{c.reason}</span>
                        <span className="text-fg font-semibold tabular-nums">
                          {c.count}건
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 실패 행 — 행 단위 */}
              {detail.rows.length > 0 && (
                <div className="mt-5">
                  <p className="text-fg text-xs font-semibold">
                    실패 행 — 행 단위
                  </p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {detail.rows.map((r) => (
                      <li key={r.id} className="flex gap-2.5">
                        <span className="text-fg-subtle font-mono text-[12px]">
                          #{r.lineNo}
                        </span>
                        <span className="min-w-0">
                          <span className="text-fg block text-[13px] font-medium">
                            {r.reason}
                          </span>
                          {r.detail && (
                            <span className="text-fg-muted block text-xs">
                              {r.detail}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 이 세션 액션 */}
              {detail.status !== 'discarded' && detail.status !== 'success' && (
                <div className="mt-6">
                  <p className="text-fg text-xs font-semibold">이 세션 액션</p>
                  <div className="mt-2 flex flex-col gap-2">
                    <SessionAction
                      icon={RotateCcw}
                      title="수정 CSV 업로드 후 재시도"
                      desc="실패 행만 보정한 CSV로 다시 인입"
                      onClick={() => navigate('/admin/csv-mapping')}
                    />
                    <SessionAction
                      icon={Download}
                      title="실패 행 다운로드"
                      desc={`${detail.rows.length}건의 행을 별도 CSV로 추출`}
                      onClick={() =>
                        toast.info('실패 행 다운로드는 준비 중입니다.')
                      }
                    />
                    <SessionAction
                      icon={XCircle}
                      title="결정적 폐기"
                      desc="이 세션의 실패 행을 폐기 — 복구 불가"
                      tone="danger"
                      onClick={() => {
                        const s = sessions.find(
                          (x) => x.id === detail.sessionId,
                        )
                        if (s) setDiscardTarget(s)
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-fg-subtle text-sm">세션을 선택하세요.</p>
          )}
        </aside>
      </div>

      {/* CSV 인입 정책 — 하단 콜아웃 */}
      <div className="border-info/30 bg-info-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-info inline-flex items-center gap-1.5 text-base font-bold">
          <Info className="h-4 w-4" />
          CSV 인입 정책
        </p>
        <ul className="text-info/90 mt-2 flex flex-col gap-1.5 text-[13px] leading-relaxed">
          <li>
            도메인: 학생 명단(과거) · 프로젝트 · 이력서 · 기록실 · 트러블슈팅 등
            다중
          </li>
          <li>
            출시 전 과거 수료생 데이터 백필이 1순위 — 수강생 본인 증명서 데이터
            입력은 2순위
          </li>
          <li>결정적 폐기는 복구 불가 — 폐기 전 실패 행 다운로드를 권장</li>
        </ul>
      </div>

      {/* 재시도 확인 모달 (Figma 1306:8009 / 결과 1306:8045) */}
      <ActionModal
        spec={retrySpec}
        onClose={() => setRetryTarget(null)}
        onConfirm={(memo) => handleRetry(memo)}
        pending={sessionAction.isPending}
      />

      {/* 결정적 폐기 확인 모달 */}
      <ActionModal
        spec={discardSpec}
        onClose={() => setDiscardTarget(null)}
        onConfirm={(memo) => handleDiscard(memo)}
        pending={sessionAction.isPending}
      />
    </div>
  )
}

// 세션 상세 — 액션 카드 한 줄.
function SessionAction({
  icon: Icon,
  title,
  desc,
  tone = 'default',
  onClick,
}: {
  icon: typeof RotateCcw
  title: string
  desc: string
  tone?: 'default' | 'danger'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border hover:bg-surface-muted flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors"
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          tone === 'danger' ? 'text-danger' : 'text-brand',
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="text-fg block text-[13px] font-semibold">{title}</span>
        <span className="text-fg-muted block text-xs">{desc}</span>
      </span>
    </button>
  )
}
