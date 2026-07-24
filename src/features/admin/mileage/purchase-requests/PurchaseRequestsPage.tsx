import { useMemo, useState } from 'react'

import { ArrowRight } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/Select'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard, type KpiTone } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
// 운영 액션 모달 v2 공통 — 처리 요약 + 메모 + 권한 확인(재사용).
import {
  ActionModal,
  type ActionModalSpec,
} from '@/features/admin/settings/ActionModal'
import { MileageTabs } from '../MileageTabs'
import { CohortScopeSelect } from '../CohortScope'
import { usePurchaseProcess, usePurchaseQueue } from './api'
import type { PurchaseRequest, PurchaseStatus, PurchaseType } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'

const STATUS_META: Record<
  PurchaseStatus,
  { label: string; tone: BadgeTone; kpi: KpiTone }
> = {
  pending: { label: '요청 대기', tone: 'info', kpi: 'info' },
  approved: { label: '승인', tone: 'success', kpi: 'success' },
  revision: { label: '보완 요청', tone: 'warning', kpi: 'warning' },
  rejected: { label: '반려', tone: 'danger', kpi: 'danger' },
  canceled: { label: '취소', tone: 'neutral', kpi: 'default' },
}

// 구매 유형 라벨 — 저장 enum(BOOK/GIFTICON/LECTURE)은 유지, 화면은 한글.
const TYPE_LABEL: Record<PurchaseType, string> = {
  BOOK: '도서',
  GIFTICON: '기프티콘',
  LECTURE: '인터넷 강의',
}

// 마일리지 구매 요청 (/admin/mileage/purchase-requests) — 운영(MANAGER/ADMIN) 신규.
// Figma 1235:6815 + 처리 모달(1306:8329). 수강생 구매 요청 승인·수정 요청·반려 큐.
// 처리 결과(원장 차감·상태 변경)는 BE 계약(P0_16) 미확정 → mock 흐름 + TODO.
export default function PurchaseRequestsPage() {
  usePageHeader(
    '마일리지 구매 요청',
    '수강생의 상품 구매 요청을 확인하고 승인·반려합니다',
  )
  const [cohortId, setCohortId] = useSearchParamState('cohortId')
  const { data, isPending, isError, refetch } = usePurchaseQueue(cohortId)
  const processReq = usePurchaseProcess()
  const toast = useToast()
  const [status, setStatus] = useSearchParamState('status', 'pending')
  const [q, setQ] = useSearchParamState('q')
  const [process, setProcess] = useState<{
    spec: ActionModalSpec
    id: string
    next: PurchaseStatus
  } | null>(null)

  const requests = useMemo(() => data?.requests ?? [], [data])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return requests.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (needle) {
        const hay = `${r.studentName} ${r.productName} ${r.type}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [requests, status, q])

  const { course, cohortLabel, kpis, total, pendingCount, limitExceededCount } =
    data ?? {
      course: '',
      cohortLabel: '',
      kpis: [],
      total: 0,
      pendingCount: 0,
      limitExceededCount: 0,
    }

  const NEXT_STATUS: Record<'승인' | '수정 요청' | '반려', PurchaseStatus> = {
    승인: 'approved',
    '수정 요청': 'revision',
    반려: 'rejected',
  }
  const openProcess = (
    r: PurchaseRequest,
    action: '승인' | '수정 요청' | '반려',
  ) => {
    setProcess({
      id: r.id,
      next: NEXT_STATUS[action],
      spec: {
        title: `구매 요청 ${action}`,
        subtitle: `${r.studentName} · ${r.productName}`,
        rows: [
          {
            label: '수강생',
            value: `${r.studentName} · ${course} ${cohortLabel}`,
          },
          { label: '상품', value: `[${TYPE_LABEL[r.type]}] ${r.productName}` },
          {
            label: '수량·가격',
            value: `${r.qty}개 · ${r.price.toLocaleString()}M`,
          },
          {
            label: '검증',
            value: r.limitExceeded
              ? '타입 한도 초과 — 승인 차단'
              : '타입 한도 정상',
          },
        ],
        confirmLabel: action,
      },
    })
  }

  const columns: Column<PurchaseRequest>[] = [
    {
      key: 'status',
      header: '상태',
      className: 'w-24',
      cell: (r) => (
        <StatusBadge
          label={STATUS_META[r.status].label}
          tone={STATUS_META[r.status].tone}
        />
      ),
    },
    {
      key: 'type',
      header: '타입',
      className: 'w-24',
      cell: (r) => <StatusBadge label={TYPE_LABEL[r.type]} tone="neutral" />,
    },
    {
      key: 'student',
      header: '수강생',
      className: 'w-28',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Avatar name={r.studentName} size={24} />
          <span className="text-fg text-[13px] font-medium">
            {r.studentName}
          </span>
        </div>
      ),
    },
    {
      key: 'product',
      header: '상품명',
      cell: (r) => (
        <div className="min-w-0">
          <p className="text-fg text-[13px]">{r.productName}</p>
          {r.link ? (
            <a
              href={r.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-brand block max-w-[280px] truncate text-[11px] font-medium hover:underline"
              title={r.link}
            >
              구매 링크 열기 ↗
            </a>
          ) : (
            r.needsLink && (
              <p className="text-warning text-[11px]">구매 링크 미제출</p>
            )
          )}
        </div>
      ),
    },
    {
      key: 'qty',
      header: '수량',
      className: 'w-14',
      cell: (r) => <span className="text-fg text-[13px]">{r.qty}개</span>,
    },
    {
      key: 'price',
      header: '신청 가격',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg text-[13px] tabular-nums">
          {r.price.toLocaleString()} <span className="text-fg-subtle">M</span>
        </span>
      ),
    },
    {
      key: 'date',
      header: '신청일',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg-muted text-[13px] whitespace-nowrap">
          {r.date}
        </span>
      ),
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-52',
      cell: (r) => {
        if (r.status !== 'pending') {
          return (
            <button
              type="button"
              // TODO: 구매 요청 상세(P0_16)
              onClick={() =>
                toast.info(`${r.studentName} 구매 요청 상세는 준비 중입니다.`)
              }
              className="text-brand inline-flex items-center gap-1 text-[13px] font-semibold hover:underline"
            >
              상세 확인
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )
        }
        if (r.limitExceeded) {
          return (
            <span className="text-warning text-[12px] font-semibold">
              한도 초과 — 승인 차단
            </span>
          )
        }
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => openProcess(r, '승인')}
              className="bg-success-bg text-success hover:bg-success-bg/70 rounded-md px-2 py-1 text-xs font-semibold"
            >
              승인
            </button>
            <button
              type="button"
              onClick={() => openProcess(r, '수정 요청')}
              className="bg-warning-bg text-warning hover:bg-warning-bg/70 rounded-md px-2 py-1 text-xs font-semibold"
            >
              수정 요청
            </button>
            <button
              type="button"
              onClick={() => openProcess(r, '반려')}
              className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2 py-1 text-xs font-semibold"
            >
              반려
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-8">
      {/* 브레드크럼 */}
      {/* 클러스터 탭 + 기수 필터(실 BE) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MileageTabs />
        <CohortScopeSelect value={cohortId} onChange={setCohortId} />
      </div>

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonListPage kpis={4} columns={6} className="" />}
        errorTitle="구매 요청을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {/* 상태 KPI 5종 */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k) => (
            <KpiCard
              key={k.status}
              label={k.label}
              value={`${k.count}건`}
              hint={k.note}
              tone={STATUS_META[k.status].kpi}
            />
          ))}
        </div>

        {/* 필터 */}
        <div className="border-border bg-surface mt-5 flex flex-wrap items-center gap-2 rounded-xl border p-3.5">
          <Select
            aria-label="상태 필터"
            value={status}
            onChange={(v) => setStatus(v)}
            options={[
              { value: 'all', label: '상태 전체' },
              ...(Object.keys(STATUS_META) as PurchaseStatus[]).map((key) => ({
                value: key,
                label: STATUS_META[key].label,
              })),
            ]}
            className="h-9"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="수강생·상품명·키워드 검색"
            aria-label="수강생·상품명·키워드 검색"
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-9 w-64 rounded-lg border px-3 text-sm outline-none focus-visible:shadow-none"
          />
        </div>

        {/* 처리 큐 표 */}
        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            empty="조건에 맞는 구매 요청이 없어요"
          />
          <div className="text-fg-subtle mt-3 text-xs">
            총 {total}건 · PENDING {pendingCount} · 한도 초과{' '}
            {limitExceededCount}건
          </div>
        </div>

        {/* 처리 모달 — 운영 액션 모달 공통 재사용 */}
        <ActionModal
          spec={process?.spec ?? null}
          onClose={() => setProcess(null)}
          onConfirm={(memo) => {
            if (!process) return
            const label = process.spec.confirmLabel
            processReq.mutate(
              { id: process.id, next: process.next, memo },
              {
                onSuccess: () => {
                  setProcess(null)
                  toast.success(`구매 요청 ${label} 처리됨`)
                },
                onError: () => {
                  setProcess(null)
                  toast.danger(
                    `구매 요청 ${label} 처리에 실패했어요. 잠시 후 다시 시도해 주세요.`,
                  )
                },
              },
            )
          }}
        />
      </DataBoundary>
    </div>
  )
}
