import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Input } from '@/components/ui/Input'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Pagination } from '@/components/data/Pagination'
import { KpiCard } from '@/components/data/KpiCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import type {
  HrdApiKey,
  HrdKeyHistoryAction,
  HrdKeyHistoryRow,
} from '@/shared/types'
import {
  useHrdKeyList,
  useHrdKeySummary,
  useHrdKeyHistory,
  useCreateHrdKey,
  useUpdateHrdKey,
  useDeleteHrdKey,
  useTestHrdKey,
} from '../api/settings'
import { formatDate, formatDateTime } from '@/shared/lib/date'
import { ActionModal, type ActionModalSpec } from './ActionModal'
import { SettingsTabs } from './SettingsTabs'
import { hrdKeySchema, type HrdKeyInput } from './hrdKey.schema'

type HistoryFilter = 'all' | HrdKeyHistoryAction

// BE history action(create/update/delete/test) 표시 라벨.
const ACTION_LABEL: Record<HrdKeyHistoryAction, string> = {
  create: '등록',
  update: '수정',
  delete: '삭제',
  test: '연결 테스트',
}

const HISTORY_FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'create', label: '등록' },
  { key: 'update', label: '수정' },
  { key: 'delete', label: '삭제' },
  { key: 'test', label: '연결 테스트' },
]

const KEY_PAGE_SIZE = 6
const HISTORY_PAGE_SIZE = 8

// ISO-8601 Instant → 'YYYY-MM-DD' (공용 Intl 유틸 — KST 고정)
function fmtDate(iso: string) {
  return formatDate(iso) || '-'
}

// ISO-8601 Instant → 'YYYY-MM-DD HH:mm' — 연도 생략 시 해가 바뀐 이력이 모호해져 연도 포함.
function fmtDateTime(iso: string) {
  return formatDateTime(iso) || '-'
}

// axios 에러에서 BE 메시지(ErrorResponse.message) 추출, 없으면 fallback.
function errMsg(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string } | undefined)?.message
    if (msg) return msg
  }
  return fallback
}

// HRD API Key 관리 (/admin/settings/hrd-api-key) — learning-service 실연동.
// 키 원문은 마스킹 표시·암호화 저장·재조회 불가. 상태는 active 토글(활성/비활성)로 관리.
export default function HrdApiKeyPage() {
  usePageHeader('운영 설정 · HRD API Key')
  const toast = useToast()

  const [keyPage, setKeyPage] = useState(1)
  const [historyFilter, setHistoryFilter] = useSearchParamState(
    'historyfilter',
    'all',
  )
  const [historyPage, setHistoryPage] = useState(1)
  const [activateNow, setActivateNow] = useState(true)
  const [modal, setModal] = useState<ActionModalSpec | null>(null)
  // 삭제 확인 대상 — 파괴적 액션은 ActionModal 확인을 거친다.
  const [deleteTarget, setDeleteTarget] = useState<HrdApiKey | null>(null)
  // 연결 테스트 진행 대상(키 id) — non-null이면 테스트 중.
  const [testingId, setTestingId] = useState<string | null>(null)

  // 서버 데이터 — BE page는 0-base라 (UI 1-base − 1)로 변환.
  const listQuery = useHrdKeyList({ page: keyPage - 1, size: KEY_PAGE_SIZE })
  const summaryQuery = useHrdKeySummary()
  const historyQuery = useHrdKeyHistory({
    page: historyPage - 1,
    size: HISTORY_PAGE_SIZE,
    action: historyFilter as HistoryFilter,
  })

  const createKey = useCreateHrdKey()
  const updateKey = useUpdateHrdKey()
  const deleteKey = useDeleteHrdKey()
  const testKey = useTestHrdKey()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HrdKeyInput>({ resolver: zodResolver(hrdKeySchema) })

  // 실패 시 표시할 에러 카피 — HRD는 실 BE(learning-service) 전용. mock 모드(기본 dev)에선 mock 토큰이라 401이 난다.
  const errStatus = isAxiosError(listQuery.error)
    ? listQuery.error.response?.status
    : undefined
  const realAuth = import.meta.env.VITE_REAL_AUTH === 'true'
  const errCopy = !realAuth
    ? {
        title: 'HRD API Key는 서버 연동 환경에서만 사용할 수 있어요',
        description:
          '관리자(ADMIN/MANAGER) 계정으로 로그인했는지 확인해 주세요.',
      }
    : errStatus === 401 || errStatus === 403
      ? {
          title: '인증이 필요해요',
          description:
            '로그인이 만료됐거나 권한이 없습니다. ADMIN/MANAGER로 다시 로그인해 주세요(토큰 TTL 30분).',
        }
      : {
          title: 'HRD API Key를 불러오지 못했어요',
          description: '연결 상태를 확인한 뒤 다시 시도해 주세요.',
        }

  const list = listQuery.data
  const summary = summaryQuery.data
  const history = historyQuery.data

  const lastTest = summary?.lastTest ?? null
  const activeCount =
    summary?.activeKeys ?? (list?.items ?? []).filter((k) => k.active).length
  const isTesting = testingId !== null

  const openHistoryDetail = (h: HrdKeyHistoryRow) => {
    setModal({
      title: 'API Key 이력 상세',
      subtitle: '키 등록·수정·삭제·연결 테스트 이력을 확인합니다.',
      rows: [
        { label: '일시', value: fmtDateTime(h.at) },
        { label: '담당자', value: h.actor },
        {
          label: '작업/결과',
          value: `${ACTION_LABEL[h.action]} · ${h.ok ? '성공' : '실패'}`,
        },
        {
          label: '응답',
          value: h.responseMs != null ? `${h.responseMs}ms` : '-',
        },
        { label: '대상 키', value: h.targetKeyMasked },
      ],
      confirmLabel: '확인',
    })
  }

  const onRegister = handleSubmit((input) => {
    createKey.mutate(
      {
        name: input.name,
        keyValue: input.key,
        description: input.description?.trim() || undefined,
        active: activateNow,
      },
      {
        onSuccess: (created) => {
          toast.success(
            `${created.name} 등록 완료${created.active ? ' · 활성' : ' · 보관'}`,
          )
          reset()
        },
        onError: (e) => toast.danger(errMsg(e, '등록에 실패했어요')),
      },
    )
  })

  // 활성 ↔ 비활성 전환 (BE PATCH active).
  const toggleActive = (k: HrdApiKey) => {
    updateKey.mutate(
      { id: k.id, input: { active: !k.active } },
      {
        onSuccess: () =>
          toast.success(`${k.name} ${k.active ? '비활성화' : '활성화'}`),
        onError: (e) => toast.danger(errMsg(e, '상태 변경에 실패했어요')),
      },
    )
  }

  // 삭제 확인 모달 스펙 — 복구 불가 액션임을 요약에 명시.
  const deleteSpec: ActionModalSpec | null = deleteTarget
    ? {
        title: 'API Key 삭제',
        subtitle:
          '삭제한 키는 복구할 수 없습니다. 연동 호출이 즉시 중단됩니다.',
        rows: [
          { label: '대상 키', value: deleteTarget.name },
          { label: 'Masked Key', value: deleteTarget.maskedKey },
          {
            label: '상태',
            value: deleteTarget.active ? '활성 (사용 중일 수 있음)' : '비활성',
          },
          { label: '처리', value: '영구 삭제 — 감사 로그 기록' },
        ],
        confirmLabel: '삭제',
      }
    : null
  const removeKey = () => {
    if (!deleteTarget) return
    const k = deleteTarget
    deleteKey.mutate(k.id, {
      onSuccess: () => toast.success(`${k.name} 삭제 — 감사 로그 기록`),
      onError: (e) => toast.danger(errMsg(e, '삭제에 실패했어요')),
      onSettled: () => setDeleteTarget(null),
    })
  }

  // 연결 테스트 — BE가 저장된 키로 검증(현재는 active 여부 기준 stub).
  const testConnection = (k: HrdApiKey) => {
    if (isTesting) return
    setTestingId(k.id)
    testKey.mutate(k.id, {
      onSuccess: (res) => {
        if (res.ok) toast.success(`${k.name} 연결 성공 · ${res.latencyMs}ms`)
        else
          toast.danger(
            `${k.name} 연결 실패${res.error ? ` · ${res.error}` : ''}`,
          )
      },
      onError: (e) => toast.danger(errMsg(e, '연결 테스트에 실패했어요')),
      onSettled: () => setTestingId(null),
    })
  }

  const keyColumns: Column<HrdApiKey>[] = [
    {
      key: 'name',
      header: '이름',
      cell: (k) => (
        <div>
          <p className="text-fg text-sm font-medium">{k.name}</p>
          {k.description && (
            <p className="text-fg-subtle text-xs">{k.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'masked',
      header: 'Masked Key',
      cell: (k) => (
        <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 font-mono text-xs">
          {k.maskedKey}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '생성일',
      cell: (k) => (
        <span className="text-fg-muted text-sm">{fmtDate(k.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-20',
      cell: (k) => (
        <StatusBadge
          label={k.active ? '활성' : '비활성'}
          tone={k.active ? 'success' : 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (k) => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => testConnection(k)}
            disabled={isTesting}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            {testingId === k.id ? '테스트 중…' : '연결 테스트'}
          </button>
          <button
            type="button"
            onClick={() => toggleActive(k)}
            disabled={updateKey.isPending}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            {k.active ? '비활성화' : '활성화'}
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(k)}
            disabled={deleteKey.isPending}
            className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      ),
    },
  ]

  const historyColumns: Column<HrdKeyHistoryRow>[] = [
    {
      key: 'at',
      header: '일시',
      className: 'w-28',
      cell: (h) => (
        <span className="text-fg-muted text-sm">{fmtDateTime(h.at)}</span>
      ),
    },
    {
      key: 'action',
      header: '작업',
      className: 'w-28',
      cell: (h) => <StatusBadge label={ACTION_LABEL[h.action]} tone="accent" />,
    },
    {
      key: 'actor',
      header: '담당자',
      className: 'w-24',
      cell: (h) => <span className="text-fg text-sm">{h.actor}</span>,
    },
    {
      key: 'result',
      header: '결과',
      className: 'w-24',
      cell: (h) => (
        <StatusBadge
          label={h.ok ? '성공' : '실패'}
          tone={h.ok ? 'success' : 'danger'}
        />
      ),
    },
    {
      key: 'response',
      header: '응답',
      className: 'w-24',
      cell: (h) => (
        <span className="text-fg-muted text-sm">
          {h.responseMs != null ? `${h.responseMs}ms` : '-'}
        </span>
      ),
    },
    {
      key: 'target',
      header: '대상 키',
      cell: (h) => (
        <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 font-mono text-xs">
          {h.targetKeyMasked}
        </span>
      ),
    },
    {
      key: 'detail',
      header: '',
      align: 'right',
      className: 'w-24',
      cell: (h) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            openHistoryDetail(h)
          }}
          className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
        >
          상세 <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 히어로 */}
      <div className="bg-brand text-on-color mt-4 flex flex-wrap items-start justify-between gap-4 rounded-xl px-6 py-5">
        <div>
          <p className="text-on-color/60 text-[11px] font-semibold tracking-wider">
            HRD API KEY · HRD-Net 연동
          </p>
          <p className="mt-1 text-xl font-bold">HRD API Key 관리</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="bg-surface/15 flex items-center gap-1.5 rounded-full px-2.5 py-1">
              <CheckCircle2 className="h-3 w-3" />
              {lastTest
                ? lastTest.ok
                  ? '최근 연결 정상'
                  : '최근 연결 실패'
                : '연결 테스트 이력 없음'}
            </span>
            {lastTest && (
              <span className="bg-surface/15 flex items-center gap-1.5 rounded-full px-2.5 py-1">
                <Clock className="h-3 w-3" /> 마지막 연결 테스트{' '}
                {fmtDateTime(lastTest.at)} · {lastTest.latencyMs}ms
              </span>
            )}
          </div>
        </div>
      </div>

      <SettingsTabs
        right={
          <>
            <ShieldCheck className="h-3 w-3" /> 원문 마스킹 · 암호화 저장 ·
            재조회 불가
          </>
        }
      />

      <DataBoundary
        isPending={listQuery.isPending}
        isError={listQuery.isError || !list}
        onRetry={listQuery.refetch}
        errorTitle={errCopy.title}
        errorDescription={errCopy.description}
      >
        {list && (
          <>
            {/* KPI 4 */}
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="활성 키"
                value={activeCount}
                hint="active = true 기준"
              />
              <KpiCard
                label="마지막 검증"
                value={lastTest ? (lastTest.ok ? '성공' : '실패') : '없음'}
                tone={
                  lastTest ? (lastTest.ok ? 'success' : 'danger') : 'default'
                }
                hint={
                  lastTest
                    ? `${fmtDateTime(lastTest.at)} · ${lastTest.latencyMs}ms`
                    : '테스트 이력 없음'
                }
              />
              <KpiCard
                label="만료/교체 예정"
                value={summary?.expiring ?? 0}
                tone={(summary?.expiring ?? 0) > 0 ? 'warning' : 'default'}
                hint="만료 정책 연동 시 표시"
              />
              <KpiCard
                label="최근 실패"
                value={summary?.recentFail ?? 0}
                tone={(summary?.recentFail ?? 0) > 0 ? 'danger' : 'default'}
                hint="24시간 기준"
              />
            </div>

            {/* 키 테이블 + 새 키 등록 폼 */}
            <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_380px]">
              <div>
                <div className="mb-2 flex items-end justify-between">
                  <div>
                    <p className="text-fg text-sm font-bold">등록된 API Key</p>
                    <p className="text-fg-subtle text-xs">
                      키 원문은 마스킹되어 표시 · 암호화 저장 · 재조회 불가
                    </p>
                  </div>
                  <StatusBadge
                    label={`총 ${list.totalElements}건`}
                    tone="neutral"
                  />
                </div>
                <DataTable
                  columns={keyColumns}
                  rows={list.items}
                  rowKey={(k) => k.id}
                  empty="등록된 키가 없어요"
                />
                {list.totalElements > 0 && (
                  <div className="mt-3">
                    <Pagination
                      page={keyPage}
                      pageCount={Math.max(1, list.totalPages)}
                      totalCount={list.totalElements}
                      shownCount={list.items.length}
                      onPage={setKeyPage}
                    />
                  </div>
                )}
              </div>

              <form
                onSubmit={onRegister}
                className="border-border bg-surface h-fit rounded-xl border p-5"
              >
                <p className="text-fg flex items-center gap-1.5 text-sm font-bold">
                  <KeyRound className="h-4 w-4" /> 새 API Key 등록
                </p>
                <p className="text-fg-subtle mt-0.5 text-xs">
                  등록 후 키 원문은 다시 표시되지 않습니다
                </p>
                <div className="mt-4 flex flex-col gap-4">
                  <Input
                    label="API 이름"
                    required
                    placeholder="HRD 운영키 2026"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <Input
                    label="API Key"
                    required
                    type="password"
                    placeholder="********-********-********"
                    error={errors.key?.message}
                    {...register('key')}
                  />
                  <Input
                    label="설명"
                    placeholder="운영용 · 분기별 교체 예정"
                    error={errors.description?.message}
                    {...register('description')}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-fg text-xs font-medium">
                      등록 즉시 사용
                    </p>
                    <p className="text-fg-subtle text-[11px]">
                      OFF 시 비활성으로 보관
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={activateNow}
                    aria-label="등록 즉시 사용"
                    onClick={() => setActivateNow((v) => !v)}
                    className={cn(
                      'h-6 w-11 rounded-full p-0.5 transition-colors',
                      activateNow ? 'bg-brand' : 'bg-border',
                    )}
                  >
                    <span
                      className={cn(
                        'bg-surface block h-5 w-5 rounded-full transition-transform',
                        activateNow && 'translate-x-5',
                      )}
                    />
                  </button>
                </div>
                <div className="border-divider mt-4 flex gap-2 border-t pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createKey.isPending}
                  >
                    {createKey.isPending ? '등록 중…' : '등록'}
                  </Button>
                </div>
                <p className="bg-surface-muted text-fg-muted mt-3 flex items-start gap-1.5 rounded-lg p-3 text-xs">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  연결 테스트는 등록된 키 행에서 실행할 수 있습니다
                </p>
              </form>
            </div>

            {/* 이력 */}
            <div className="mt-6">
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-fg text-sm font-bold">이력</p>
                  <p className="text-fg-subtle text-xs">
                    등록·수정·삭제·연결 테스트 · 감사 로그
                  </p>
                </div>
                <div className="flex gap-1">
                  {HISTORY_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setHistoryFilter(f.key)
                        setHistoryPage(1)
                      }}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-medium',
                        historyFilter === f.key
                          ? 'bg-accent-bg text-accent-strong'
                          : 'text-fg-muted hover:bg-surface-muted',
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <DataTable
                columns={historyColumns}
                rows={history?.items ?? []}
                rowKey={(h) => h.id}
                onRowClick={openHistoryDetail}
                empty={
                  historyQuery.isError
                    ? '이력을 불러오지 못했어요'
                    : '이력이 없어요'
                }
              />
              {history && history.totalElements > 0 && (
                <div className="mt-3">
                  <Pagination
                    page={historyPage}
                    pageCount={Math.max(1, history.totalPages)}
                    totalCount={history.totalElements}
                    shownCount={history.items.length}
                    onPage={setHistoryPage}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </DataBoundary>

      <ActionModal
        spec={modal}
        onClose={() => setModal(null)}
        onConfirm={() => setModal(null)}
      />

      {/* 키 삭제 확인 — 복구 불가 액션 */}
      <ActionModal
        spec={deleteSpec}
        onClose={() => setDeleteTarget(null)}
        onConfirm={removeKey}
        pending={deleteKey.isPending}
      />
    </div>
  )
}
