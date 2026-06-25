import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  KeyRound,
  PlugZap,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Input } from '@/components/ui/Input'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type {
  HrdApiKey,
  HrdKeyHistoryAction,
  HrdKeyHistoryRow,
} from '@/shared/types'
import { useHrdKeys } from '../api/settings'
import { ActionModal, type ActionModalSpec } from './ActionModal'
import { SettingsBreadcrumb } from './SettingsBreadcrumb'
import { SettingsTabs } from './SettingsTabs'
import { hrdKeySchema, type HrdKeyInput } from './hrdKey.schema'

type HistoryFilter = 'all' | HrdKeyHistoryAction

const ACTION_LABEL: Record<HrdKeyHistoryAction, string> = {
  register: '키 등록',
  rotate: '키 교체',
  revoke: '키 폐기',
  test: '연결 테스트',
}

const HISTORY_FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'register', label: '등록' },
  { key: 'rotate', label: '교체' },
  { key: 'revoke', label: '폐기' },
  { key: 'test', label: '테스트' },
]

// HRD API Key 관리 (/admin/settings/hrd-api-key) — 등록·교체·폐기 + 이력. (Figma 1284:8960)
// 키 원문은 마스킹 표시·암호화 저장·재조회 불가(§5). 이력 상세는 운영 액션 모달 v2(1306:8257).
export default function HrdApiKeyPage() {
  const { data, isPending, isError, refetch } = useHrdKeys()
  const toast = useToast()
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [activateNow, setActivateNow] = useState(true)
  const [modal, setModal] = useState<ActionModalSpec | null>(null)
  usePageHeader(
    '운영 설정 · HRD API Key',
    'HRD-Net 연동 API Key를 등록·교체·폐기합니다',
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HrdKeyInput>({ resolver: zodResolver(hrdKeySchema) })

  const filteredHistory = useMemo(() => {
    const rows = data?.history ?? []
    if (historyFilter === 'all') return rows
    return rows.filter((h) => h.action === historyFilter)
  }, [data, historyFilter])

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="HRD API Key를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const { summary } = data

  const openHistoryDetail = (h: HrdKeyHistoryRow) => {
    setModal({
      title: 'API Key 이력 상세',
      subtitle: '키 교체·폐기 이력을 확인합니다.',
      rows: [
        { label: '최근 변경', value: `${h.at} · ${h.actor}` },
        {
          label: '작업/결과',
          value: `${ACTION_LABEL[h.action]} · ${h.ok ? '성공' : `실패 (${h.response ?? '-'})`}`,
        },
        { label: '보안 정책', value: '키 값은 저장 후 재표시하지 않음' },
        { label: '감사 로그', value: 'hrd_key_rotated 기록' },
      ],
      confirmLabel: '확인',
    })
  }

  const onRegister = handleSubmit((input) => {
    toast.success(
      `${input.name} 등록 — ${activateNow ? '즉시 사용' : '보조키 보관'} (mock)`,
    )
    toast.info('활성 키가 1개 이상이면 등록은 자동으로 교체로 처리됩니다')
    reset()
  })

  const keyColumns: Column<HrdApiKey>[] = [
    {
      key: 'name',
      header: '이름',
      cell: (k) => (
        <div>
          <p className="text-fg text-sm font-medium">{k.name}</p>
          {k.isPrimary && (
            <span className="bg-accent-bg text-accent-strong mt-0.5 inline-block rounded px-1 py-px text-[10px] font-bold">
              기본
            </span>
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
      cell: (k) => <span className="text-fg-muted text-sm">{k.createdAt}</span>,
    },
    {
      key: 'lastUsed',
      header: '마지막 사용',
      cell: (k) => (
        <span className="text-fg-muted text-sm">{k.lastUsedAt}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-20',
      cell: (k) => (
        <StatusBadge
          label={k.status === 'active' ? '활성' : '폐기'}
          tone={k.status === 'active' ? 'success' : 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (k) =>
        k.status === 'revoked' ? (
          <span className="text-fg-subtle text-xs">폐기됨 — 작업 불가</span>
        ) : (
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() =>
                toast.success(`${k.name} 연결 테스트 성공 · 220ms (mock)`)
              }
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium"
            >
              연결 테스트
            </button>
            <button
              type="button"
              onClick={() => toast.info(`${k.name} 교체 — 새 키 등록 폼 사용`)}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium"
            >
              교체
            </button>
            <button
              type="button"
              onClick={() =>
                toast.success(`${k.name} 폐기 — 감사 로그 기록 (mock)`)
              }
              className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2 py-1 text-xs font-medium"
            >
              폐기
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
      cell: (h) => <span className="text-fg-muted text-sm">{h.at}</span>,
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
        <span className="text-fg-muted text-sm">{h.response ?? '-'}</span>
      ),
    },
    {
      key: 'target',
      header: '대상 키',
      cell: (h) => (
        <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 font-mono text-xs">
          {h.targetKey}
        </span>
      ),
    },
    {
      key: 'detail',
      header: '',
      align: 'right',
      className: 'w-20',
      cell: (h) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            openHistoryDetail(h)
          }}
          className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
        >
          상세 <ArrowRight className="h-3 w-3" />
        </button>
      ),
    },
  ]

  return (
    <div className="p-8">
      <SettingsBreadcrumb current="HRD API Key" />

      {/* 히어로 */}
      <div className="bg-brand mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl px-7 py-5 text-white">
        <div>
          <p className="text-xl font-bold">
            HRD-Net 연동 API Key를 등록·교체·폐기합니다
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
              <CheckCircle2 className="h-3 w-3" />
              {summary.lastTest.ok ? '활성 키 연결 정상' : '활성 키 연결 실패'}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
              <Clock className="h-3 w-3" /> 마지막 연결 테스트{' '}
              {summary.lastTest.at} · {summary.lastTest.latency}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => toast.success('연결 테스트 성공 · 220ms (mock)')}
            className="flex items-center gap-1.5 rounded-lg border border-white px-3.5 py-2 text-xs font-semibold"
          >
            <PlugZap className="h-3.5 w-3.5" /> 연결 테스트
          </button>
          <button
            type="button"
            onClick={() => toast.info('키 교체 — 새 키 등록 시 자동 교체 처리')}
            className="text-fg flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 키 교체
          </button>
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

      {/* KPI 4 */}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="활성 키"
          value={summary.activeKeys}
          hint={summary.activeKeysHint}
        />
        <KpiCard
          label="마지막 검증"
          value={summary.lastTest.ok ? '성공' : '실패'}
          tone={summary.lastTest.ok ? 'success' : 'danger'}
          hint={`${summary.lastTest.at} · ${summary.lastTest.latency}`}
        />
        <KpiCard
          label="만료/교체 예정"
          value={summary.expiring}
          tone={summary.expiring > 0 ? 'warning' : 'default'}
          hint={summary.expiringHint}
        />
        <KpiCard
          label="최근 실패"
          value={summary.recentFail}
          tone={summary.recentFail > 0 ? 'danger' : 'default'}
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
            <StatusBadge label={`총 ${data.keys.length}건`} tone="neutral" />
          </div>
          <DataTable
            columns={keyColumns}
            rows={data.keys}
            rowKey={(k) => k.id}
            empty="등록된 키가 없어요"
          />
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
              <p className="text-fg text-xs font-medium">등록 즉시 사용</p>
              <p className="text-fg-subtle text-[11px]">OFF 시 보조키로 보관</p>
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
                  'block h-5 w-5 rounded-full bg-white transition-transform',
                  activateNow && 'translate-x-5',
                )}
              />
            </button>
          </div>
          <div className="border-divider mt-4 flex gap-2 border-t pt-4">
            <Button
              type="button"
              variant="secondary"
              className="h-10 flex-1 text-sm"
              onClick={() => toast.success('연결 테스트 성공 · 220ms (mock)')}
            >
              연결 테스트
            </Button>
            <Button type="submit" className="h-10 flex-1 text-sm">
              등록
            </Button>
          </div>
          <p className="bg-surface-muted text-fg-muted mt-3 flex items-start gap-1.5 rounded-lg p-3 text-xs">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            활성 키가 1개 이상 있으면 등록은 자동으로 교체로 처리됩니다
          </p>
        </form>
      </div>

      {/* 이력 */}
      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-fg text-sm font-bold">이력</p>
            <p className="text-fg-subtle text-xs">
              등록·교체·폐기·연결 테스트 · 감사 로그 동기 저장
            </p>
          </div>
          <div className="flex gap-1">
            {HISTORY_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setHistoryFilter(f.key)}
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
          rows={filteredHistory}
          rowKey={(h) => h.id}
          onRowClick={openHistoryDetail}
          empty="이력이 없어요"
        />
      </div>

      <ActionModal
        spec={modal}
        onClose={() => setModal(null)}
        onConfirm={() => setModal(null)}
      />
    </div>
  )
}
