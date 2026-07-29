import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { ShieldCheck } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable } from '@/components/data/DataTable'
import { Pagination } from '@/components/data/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import type { HrdApiKey, HrdKeyHistoryRow } from '@/shared/types'
import {
  useHrdKeyList,
  useHrdKeySummary,
  useHrdKeyHistory,
  useCreateHrdKey,
  useUpdateHrdKey,
  useDeleteHrdKey,
  useTestHrdKey,
} from '../api/settings'
import { ActionModal, type ActionModalSpec } from './ActionModal'
import { SettingsTabs } from './SettingsTabs'
import { hrdKeySchema, type HrdKeyInput } from './hrdKey.schema'
import {
  ACTION_LABEL,
  KEY_PAGE_SIZE,
  HISTORY_PAGE_SIZE,
  errMsg,
  fmtDateTime,
  type HistoryFilter,
} from './hrdKeyMeta'
import { buildKeyColumns } from './hrdKeyColumns'
import { HrdKeyHero } from './HrdKeyHero'
import { HrdKeyKpis } from './HrdKeyKpis'
import { HrdKeyRegisterForm } from './HrdKeyRegisterForm'
import { HrdKeyHistorySection } from './HrdKeyHistorySection'

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

  const keyColumns = buildKeyColumns({
    onTest: testConnection,
    onToggleActive: toggleActive,
    onDelete: setDeleteTarget,
    isTesting,
    testingId,
    updatePending: updateKey.isPending,
    deletePending: deleteKey.isPending,
  })

  return (
    <div className="p-8">
      {/* 히어로 */}
      <HrdKeyHero lastTest={lastTest} />

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
            <HrdKeyKpis
              activeCount={activeCount}
              lastTest={lastTest}
              summary={summary}
            />

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

              <HrdKeyRegisterForm
                onSubmit={onRegister}
                register={register}
                errors={errors}
                activateNow={activateNow}
                onToggleActivateNow={() => setActivateNow((v) => !v)}
                pending={createKey.isPending}
              />
            </div>

            {/* 이력 */}
            <HrdKeyHistorySection
              history={history}
              isError={historyQuery.isError}
              filter={historyFilter}
              onFilterChange={(key) => {
                setHistoryFilter(key)
                setHistoryPage(1)
              }}
              page={historyPage}
              onPage={setHistoryPage}
              onOpenDetail={openHistoryDetail}
            />
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
