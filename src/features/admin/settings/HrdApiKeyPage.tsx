import { useMemo, useRef, useState } from 'react'
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
import { Pagination } from '@/components/data/Pagination'
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
  const [historyPage, setHistoryPage] = useState(1)
  const [activateNow, setActivateNow] = useState(true)
  const [modal, setModal] = useState<ActionModalSpec | null>(null)
  // 폐기/등록 낙관 반영 — mock(새로고침 리셋).
  const [revokedIds, setRevokedIds] = useState<Record<string, boolean>>({})
  const [addedKeys, setAddedKeys] = useState<HrdApiKey[]>([])
  const [addedHistory, setAddedHistory] = useState<HrdKeyHistoryRow[]>([])
  // 연결 테스트 진행 대상(키 식별자) — non-null이면 테스트 중. 실제 검증은 BE 프록시 필요.
  const [testingTarget, setTestingTarget] = useState<string | null>(null)
  // 활성(기본) 키 override — 새 키를 '즉시 사용'으로 등록하면 그 키가 기본이 됨(교체). null=데이터 기본값.
  const [primaryKeyId, setPrimaryKeyId] = useState<string | null>(null)
  // 폐기된 키 삭제(목록에서 제거) — mock.
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({})
  // 등록된 키 테이블 페이지네이션.
  const [keyPage, setKeyPage] = useState(1)
  usePageHeader('운영 설정 · HRD API Key')

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    watch,
    formState: { errors },
  } = useForm<HrdKeyInput>({ resolver: zodResolver(hrdKeySchema) })
  const formRef = useRef<HTMLFormElement>(null)

  const filteredHistory = useMemo(() => {
    const rows = [...addedHistory, ...(data?.history ?? [])]
    if (historyFilter === 'all') return rows
    return rows.filter((h) => h.action === historyFilter)
  }, [data, addedHistory, historyFilter])

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
  const keys = [...addedKeys, ...data.keys].filter((k) => !deletedIds[k.id])
  const statusOf = (k: HrdApiKey) => (revokedIds[k.id] ? 'revoked' : k.status)
  const isPrimaryOf = (k: HrdApiKey) =>
    primaryKeyId ? k.id === primaryKeyId : k.isPrimary
  const isTesting = testingTarget !== null
  // 활성 키(기본 1 + 보조 1, 최대 2) 실시간 카운트 — 등록·교체·폐기 즉시 반영.
  const activeCount = keys.filter((k) => statusOf(k) === 'active').length
  // 연결 테스트는 '활성 키 있음'이 조건(04_운영 §5) — 활성 기본 키가 없으면 테스트 불가.
  const activePrimary =
    keys.find((k) => isPrimaryOf(k) && statusOf(k) === 'active') ?? null
  const keyInput = watch('key')
  // 이력 페이지네이션 — 오래 쌓여도 표가 길어지지 않도록.
  const HISTORY_PAGE_SIZE = 8
  const historyPageCount = Math.max(
    1,
    Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE),
  )
  const historySafePage = Math.min(historyPage, historyPageCount)
  const pagedHistory = filteredHistory.slice(
    (historySafePage - 1) * HISTORY_PAGE_SIZE,
    historySafePage * HISTORY_PAGE_SIZE,
  )
  // 등록된 키 페이지네이션 — 폐기 키가 쌓여도 표가 길어지지 않도록.
  const KEY_PAGE_SIZE = 6
  const keyPageCount = Math.max(1, Math.ceil(keys.length / KEY_PAGE_SIZE))
  const keySafePage = Math.min(keyPage, keyPageCount)
  const pagedKeys = keys.slice(
    (keySafePage - 1) * KEY_PAGE_SIZE,
    keySafePage * KEY_PAGE_SIZE,
  )
  // 'MM-DD HH:MM' 스탬프 (mock 이력용).
  const stamp = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  }

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
        { label: '감사 로그', value: '키 교체 이력 기록' },
      ],
      confirmLabel: '확인',
    })
  }

  const onRegister = handleSubmit((input) => {
    const masked = `${input.key.slice(0, 4).toUpperCase()}****${input.key
      .slice(-4)
      .toUpperCase()}`
    const newId = `key-new-${Date.now()}`
    const key: HrdApiKey = {
      id: newId,
      name: input.name,
      isPrimary: activateNow,
      maskedKey: masked,
      createdAt: new Date().toISOString().slice(0, 10),
      lastUsedAt: '미사용',
      status: 'active',
    }
    // 활성 키는 기본 1 + 보조 1 (최대 2)만. 같은 슬롯(기본/보조)의 기존 활성 키는 자동 폐기.
    const replaced = keys.find(
      (k) => statusOf(k) === 'active' && isPrimaryOf(k) === activateNow,
    )
    setAddedKeys((p) => [key, ...p])
    if (replaced) setRevokedIds((p) => ({ ...p, [replaced.id]: true }))
    if (activateNow) setPrimaryKeyId(newId)
    const rows: HrdKeyHistoryRow[] = []
    if (replaced) {
      rows.push({
        id: `hist-rev-${Date.now()}`,
        at: stamp(),
        action: 'revoke',
        actor: '나',
        ok: true,
        response: null,
        targetKey: replaced.maskedKey,
      })
    }
    rows.push({
      id: `hist-reg-${Date.now()}`,
      at: stamp(),
      action: activateNow ? 'rotate' : 'register',
      actor: '나',
      ok: true,
      response: null,
      targetKey: replaced ? `${masked} ← ${replaced.maskedKey}` : masked,
    })
    setAddedHistory((p) => [...rows, ...p])
    toast.success(
      activateNow
        ? replaced
          ? `${input.name} 활성화 — 기존 기본 키 폐기·교체`
          : `${input.name} 기본 키로 활성화`
        : replaced
          ? `${input.name} 보조키 등록 — 기존 보조키 폐기`
          : `${input.name} 보조키로 등록`,
    )
    reset()
  })

  const revokeKey = (k: HrdApiKey) => {
    setRevokedIds((p) => ({ ...p, [k.id]: true }))
    setAddedHistory((p) => [
      {
        id: `hist-rev-${Date.now()}`,
        at: stamp(),
        action: 'revoke',
        actor: '나',
        ok: true,
        response: null,
        targetKey: k.maskedKey,
      },
      ...p,
    ])
    toast.success(`${k.name} 폐기 — 감사 로그 기록`)
  }

  // 폐기된 키 삭제 — 목록에서 제거(mock). 폐기 이력은 그대로 남는다.
  const deleteKey = (k: HrdApiKey) => {
    setDeletedIds((p) => ({ ...p, [k.id]: true }))
    toast.success(`${k.name} 삭제 — 목록에서 제거`)
  }

  // 교체 — 등록 폼으로 스크롤·포커스(새 키 등록이 곧 교체).
  const rotate = (name?: string) => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFocus('name')
    toast.info(
      `${name ? `${name} ` : ''}키 교체 — 아래 폼에서 새 키를 등록하면 기존 활성 키가 자동 교체됩니다`,
    )
  }

  // 연결 테스트 — 실제 HRD-Net 검증은 BE 프록시(서버가 활성 키 사용)가 필요.
  // FE는 진행 상태·지연·결과 UX만 시뮬레이션한다(키 원문은 다루지 않음).
  const testConnection = (name: string, targetKey: string) => {
    if (testingTarget) return
    setTestingTarget(targetKey)
    const latency = `${180 + Math.floor(Math.random() * 140)}ms`
    window.setTimeout(() => {
      setAddedHistory((p) => [
        {
          id: `hist-test-${Date.now()}`,
          at: stamp(),
          action: 'test',
          actor: '나',
          ok: true,
          response: latency,
          targetKey,
        },
        ...p,
      ])
      toast.success(`${name} 연결 테스트 성공 · ${latency}`)
      setTestingTarget(null)
    }, 600)
  }

  const keyColumns: Column<HrdApiKey>[] = [
    {
      key: 'name',
      header: '이름',
      cell: (k) => (
        <div>
          <p className="text-fg text-sm font-medium">{k.name}</p>
          {isPrimaryOf(k) && (
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
      cell: (k) => {
        const st = statusOf(k)
        return (
          <StatusBadge
            label={st === 'active' ? '활성' : '폐기'}
            tone={st === 'active' ? 'success' : 'neutral'}
          />
        )
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (k) =>
        statusOf(k) === 'revoked' ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-fg-subtle text-xs">폐기됨</span>
            <button
              type="button"
              onClick={() => deleteKey(k)}
              className="border-border text-fg-muted hover:bg-danger-bg hover:text-danger rounded-md border px-2 py-1 text-xs font-medium"
            >
              삭제
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => testConnection(k.name, k.maskedKey)}
              disabled={isTesting}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
            >
              {testingTarget === k.maskedKey ? '테스트 중…' : '연결 테스트'}
            </button>
            <button
              type="button"
              onClick={() => rotate(k.name)}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium"
            >
              교체
            </button>
            <button
              type="button"
              onClick={() => revokeKey(k)}
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
      <div className="bg-brand mt-4 flex flex-wrap items-start justify-between gap-4 rounded-xl px-6 py-5 text-white">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-white/60">
            HRD API KEY · HRD-Net 연동
          </p>
          <p className="mt-1 text-xl font-bold">HRD API Key 관리</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
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
            onClick={() =>
              activePrimary &&
              testConnection(activePrimary.name, activePrimary.maskedKey)
            }
            disabled={isTesting || !activePrimary}
            className="flex items-center gap-1.5 rounded-lg border border-white px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
          >
            <PlugZap className="h-3.5 w-3.5" />{' '}
            {activePrimary && testingTarget === activePrimary.maskedKey
              ? '테스트 중…'
              : '연결 테스트'}
          </button>
          <button
            type="button"
            onClick={() => rotate()}
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
          value={activeCount}
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
            <StatusBadge label={`총 ${keys.length}건`} tone="neutral" />
          </div>
          <DataTable
            columns={keyColumns}
            rows={pagedKeys}
            rowKey={(k) => k.id}
            empty="등록된 키가 없어요"
          />
          {keys.length > 0 && (
            <div className="mt-3">
              <Pagination
                page={keySafePage}
                pageCount={keyPageCount}
                totalCount={keys.length}
                shownCount={pagedKeys.length}
                onPage={setKeyPage}
              />
            </div>
          )}
        </div>

        <form
          ref={formRef}
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
              disabled={isTesting || !keyInput?.trim()}
              onClick={() => testConnection('새 키', '—')}
            >
              {testingTarget === '—' ? '테스트 중…' : '연결 테스트'}
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
          rows={pagedHistory}
          rowKey={(h) => h.id}
          onRowClick={openHistoryDetail}
          empty="이력이 없어요"
        />
        {filteredHistory.length > 0 && (
          <div className="mt-3">
            <Pagination
              page={historySafePage}
              pageCount={historyPageCount}
              totalCount={filteredHistory.length}
              shownCount={pagedHistory.length}
              onPage={setHistoryPage}
            />
          </div>
        )}
      </div>

      <ActionModal
        spec={modal}
        onClose={() => setModal(null)}
        onConfirm={() => setModal(null)}
      />
    </div>
  )
}
