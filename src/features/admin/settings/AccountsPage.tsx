import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Info, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Pagination } from '@/components/data/Pagination'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import type { OpsAccount, OpsRole } from '@/shared/types'
import {
  useCreateOpsAccount,
  useOpsAccounts,
  useSettingsHub,
  useUpdateOperatorCohorts,
  useUpdateOpsAccountStatus,
} from '../api/settings'
import { ScopeModal } from './ScopeModal'
import {
  AccountCreateModal,
  type AccountCreateValues,
} from './AccountCreateModal'
import { AccountDetailModal } from './AccountDetailModal'
import { ActionModal, type ActionModalSpec } from './ActionModal'
import { SettingsTabs } from './SettingsTabs'
import { TempPasswordModal } from './TempPasswordModal'

type RoleFilter = 'all' | OpsRole
type StatusFilter = 'all' | 'active' | 'invited' | 'inactive'

const ROLE_TONE: Record<OpsRole, BadgeTone> = {
  MANAGER: 'accent',
  INSTRUCTOR: 'info',
  MENTOR: 'success',
}

// 역할 표 배지 라벨 — 한글 표기로 통일.
const ROLE_LABEL: Record<OpsRole, string> = {
  MANAGER: '매니저',
  INSTRUCTOR: '강사',
  MENTOR: '멘토',
}

const STATUS_LABEL: Record<OpsAccount['status'], string> = {
  active: '활성',
  invited: '초대 전',
  inactive: '비활성',
}

const STATUS_TONE: Record<OpsAccount['status'], BadgeTone> = {
  active: 'success',
  invited: 'warning',
  inactive: 'neutral',
}

// 생성 시 초기 비밀번호(BE 필수, 8~72자). 혼동 문자 제외 + 특수문자 1개 포함.
const PW_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
function genInitialPassword(): string {
  let s = ''
  for (let i = 0; i < 11; i += 1) {
    s += PW_CHARS[Math.floor(Math.random() * PW_CHARS.length)]
  }
  return s + '!'
}

// 운영 계정 관리 (/admin/settings/accounts) — 매니저·강사·멘토 계정/권한 관제. (Figma 1284:8597)
// 수정·담당 범위·비번 초기화·비활성화는 운영 액션 모달 v2(1306:8221)로 확인 후 실행.
export default function AccountsPage() {
  const { data, isPending, isError, refetch } = useOpsAccounts()
  // 설정 변경 감사 로그(설정 탭 하단) — 설정 허브에서 이전된 '최근 감사 로그' 섹션용.
  const { data: hub } = useSettingsHub()
  const toast = useToast()
  const createAccount = useCreateOpsAccount()
  const updateStatus = useUpdateOpsAccountStatus()
  const updateScope = useUpdateOperatorCohorts()
  const navigate = useNavigate()
  const [role, setRole] = useSearchParamState('role', 'all')
  const [status, setStatus] = useSearchParamState('status', 'all')
  const [q, setQ] = useSearchParamState('q')
  const [page, setPage] = useState(1)
  // 비활성화 낙관적 반영 — 즉시 배지 갱신(실 BE 호출 후 invalidate로 확정).
  const [statusOverride, setStatusOverride] = useState<
    Record<string, OpsAccount['status']>
  >({})
  const [modal, setModal] = useState<{
    spec: ActionModalSpec
    deactivate?: OpsAccount
  } | null>(null)
  // 비밀번호 초기화 모달 대상 계정 — non-null이면 TempPasswordModal이 열린다.
  const [pwTarget, setPwTarget] = useState<OpsAccount | null>(null)
  // 담당 과정·기수 설정 모달 대상 — non-null이면 ScopeModal이 열린다.
  const [scopeTarget, setScopeTarget] = useState<OpsAccount | null>(null)
  // 새 계정 추가 모달 개폐.
  const [createOpen, setCreateOpen] = useState(false)
  // 사용자 정보 상세 모달 대상 — 표 행 클릭 시 열린다(읽기 전용).
  const [detailTarget, setDetailTarget] = useState<OpsAccount | null>(null)
  usePageHeader('운영 설정 · 계정 관리')
  const statusOf = (a: OpsAccount) => statusOverride[a.id] ?? a.status

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    const needle = q.trim().toLowerCase()
    const list = items.filter((a) => {
      if (role !== 'all' && a.role !== role) return false
      if (status !== 'all' && (statusOverride[a.id] ?? a.status) !== status)
        return false
      if (needle) {
        const hay = `${a.name} ${a.email}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    // 이름 가나다순 고정(운영 요구)
    return [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ko'))
  }, [data, role, status, q, statusOverride])

  // 사용자 표 페이지네이션 — 사용자가 많아져도 표가 길어지지 않도록.
  const ACCOUNTS_PAGE_SIZE = 10
  const accountsPageCount = Math.max(
    1,
    Math.ceil(filtered.length / ACCOUNTS_PAGE_SIZE),
  )
  const accountsSafePage = Math.min(page, accountsPageCount)
  const pagedAccounts = filtered.slice(
    (accountsSafePage - 1) * ACCOUNTS_PAGE_SIZE,
    accountsSafePage * ACCOUNTS_PAGE_SIZE,
  )

  const onConfirm = (memo: string) => {
    const target = modal?.deactivate
    if (target) {
      // 현재 상태 기준 토글: 활성→비활성, 비활성→활성. 낙관 반영 후 실 BE(PATCH status).
      const toActive = statusOf(target) !== 'active'
      const next: 'ACTIVE' | 'INACTIVE' = toActive ? 'ACTIVE' : 'INACTIVE'
      const label = toActive ? '활성화' : '비활성화'
      setStatusOverride((p) => ({
        ...p,
        [target.id]: toActive ? 'active' : 'inactive',
      }))
      updateStatus.mutate(
        { userId: target.id, status: next, reason: memo || undefined },
        {
          onSuccess: () => toast.success(`${target.name} · ${label} 완료`),
          onError: () => toast.danger(`${target.name} · ${label}에 실패했어요`),
        },
      )
    } else {
      toast.success('변경 저장 — 감사 로그 기록')
    }
    if (memo.trim()) toast.info('매니저 메모가 감사 로그에 함께 기록됐어요')
    setModal(null)
  }

  // 담당 과정·기수 저장 — 실 BE(PUT /auth/accounts/{userId}/cohorts).
  const onScopeSave = (account: OpsAccount, cohortIds: string[]) => {
    updateScope.mutate(
      { userId: account.id, cohortIds },
      {
        onSuccess: () =>
          toast.success(
            `${account.name} · 담당 기수 ${cohortIds.length}개 저장`,
          ),
        onError: () => toast.danger(`${account.name} · 담당 기수 저장 실패`),
      },
    )
    setScopeTarget(null)
  }

  // 새 계정 추가 — 실 BE(POST /auth/accounts). BE가 비밀번호를 요구하므로 임시 비밀번호를 생성해 함께 전송.
  const onCreate = (values: AccountCreateValues) => {
    const tempPw = genInitialPassword()
    createAccount.mutate(
      {
        name: values.name,
        email: values.email,
        role: values.role,
        password: tempPw,
      },
      {
        onSuccess: () =>
          toast.success(
            `${values.name} 계정 생성 — 임시 비밀번호 ${tempPw} (1회 안내)`,
          ),
        onError: () =>
          toast.danger(
            `${values.name} 계정 생성에 실패했어요 (이메일 중복 등)`,
          ),
      },
    )
    setCreateOpen(false)
  }

  const columns: Column<OpsAccount>[] = [
    {
      key: 'user',
      header: '사용자',
      cell: (a) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={a.name} size={32} />
          <div>
            <p className="text-fg flex items-center gap-1.5 text-sm font-medium">
              {a.name}
              {a.isSelf && (
                <span className="bg-accent-bg text-accent-strong rounded px-1 py-px text-[10px] font-bold">
                  본인
                </span>
              )}
            </p>
            <p className="text-fg-subtle text-xs">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: '역할',
      className: 'w-28',
      cell: (a) => (
        <StatusBadge label={ROLE_LABEL[a.role]} tone={ROLE_TONE[a.role]} />
      ),
    },
    {
      key: 'scope',
      header: '담당 과정·기수',
      className: 'w-44',
      // 셀 클릭 → 과정/기수 다중 선택 모달(실 BE 저장).
      cell: (a) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setScopeTarget(a)
          }}
          className="border-border hover:border-brand hover:bg-surface-muted text-fg-muted w-full truncate rounded-md border px-2.5 py-1.5 text-left text-sm"
        >
          {(a.cohortIds?.length ?? 0) > 0
            ? `${a.cohortIds!.length}개 기수 담당`
            : '담당 기수 설정'}
        </button>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-24',
      cell: (a) => (
        <StatusBadge
          label={STATUS_LABEL[statusOf(a)]}
          tone={STATUS_TONE[statusOf(a)]}
        />
      ),
    },
    {
      key: 'lastLogin',
      header: '최근 로그인',
      className: 'w-28',
      cell: (a) => (
        <span className="text-fg-muted text-sm">{a.lastLoginAt ?? '-'}</span>
      ),
    },
    {
      key: 'actions',
      header: '액션',
      className: 'w-72',
      cell: (a) => (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPwTarget(a)
            }}
            className="bg-info-bg text-info hover:bg-info-bg/70 rounded-md px-2 py-1 text-xs font-medium"
          >
            비번 초기화
          </button>
          {a.isSelf ? (
            <span className="text-fg-subtle px-2 py-1 text-xs">
              상태 변경 불가
            </span>
          ) : (
            (() => {
              // 상태 토글: 활성이면 비활성화, 비활성이면 활성화.
              const isActive = statusOf(a) === 'active'
              const label = isActive ? '비활성화' : '활성화'
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setModal({
                      spec: {
                        title: `운영 계정 ${label}`,
                        subtitle: isActive
                          ? `${a.name} 계정을 비활성화합니다. 로그인이 차단됩니다.`
                          : `${a.name} 계정을 활성화합니다. 로그인이 다시 허용됩니다.`,
                        rows: [
                          { label: '계정', value: `${a.name} · ${a.role}` },
                          {
                            label: '처리',
                            value: isActive
                              ? '상태 = 비활성 · 로그인 차단'
                              : '상태 = 활성 · 로그인 허용',
                          },
                          { label: '감사 로그', value: `${label} 이력 기록` },
                        ],
                        confirmLabel: label,
                      },
                      deactivate: a,
                    })
                  }}
                  className={
                    isActive
                      ? 'border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2 py-1 text-xs font-medium'
                      : 'border-success/40 text-success hover:bg-success-bg rounded-md border px-2 py-1 text-xs font-medium'
                  }
                >
                  {label}
                </button>
              )
            })()
          )}
        </div>
      ),
    },
  ]

  const roleFilters: { key: RoleFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'MANAGER', label: '매니저' },
    { key: 'INSTRUCTOR', label: '강사' },
    { key: 'MENTOR', label: '멘토' },
  ]
  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'active', label: '활성' },
    { key: 'invited', label: '초대 전' },
    { key: 'inactive', label: '비활성' },
  ]

  return (
    <div className="p-8">
      {/* 히어로 — 요약 수치가 응답에 의존하므로 데이터가 있을 때만 렌더(셸 탭은 아래에서 항상 유지). */}
      {data && (
        <div className="bg-brand text-on-color mt-4 rounded-xl px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-on-color/60 text-[11px] font-semibold tracking-wider">
                MANAGER ACCOUNTS · 운영 계정·권한
              </p>
              <h2 className="mt-1 text-xl font-bold">
                운영진 계정과 기본 권한 범위 관리
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="bg-surface/15 rounded-full px-2.5 py-1 text-xs">
                  매니저 {data.summary.managers}
                </span>
                <span className="bg-surface/15 rounded-full px-2.5 py-1 text-xs">
                  강사 {data.summary.instructors}
                </span>
                <span className="bg-surface/15 rounded-full px-2.5 py-1 text-xs">
                  멘토 {data.summary.mentors}
                </span>
                <span className="bg-surface/15 rounded-full px-2.5 py-1 text-xs">
                  비활성 {data.summary.inactive}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="text-fg bg-surface flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
              >
                <UserPlus className="h-3.5 w-3.5" /> 새 계정 추가
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsTabs
        right={
          <>
            <Clock className="h-3 w-3" /> 역할 변경 자동 감사 로그
          </>
        }
      />

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={refetch}
        errorTitle="운영 계정을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {data && (
          <>
            {/* KPI 4 */}
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="border-border bg-surface rounded-xl border p-4">
                <p className="text-fg-subtle text-xs font-semibold tracking-wide">
                  MANAGER
                </p>
                <p className="text-fg text-2xl font-bold">
                  {data.summary.managers}{' '}
                  <span className="text-fg-subtle text-xs font-medium">
                    계정
                  </span>
                </p>
                <p className="text-fg-subtle text-xs">
                  활성 {data.summary.managersActive} · 비활성{' '}
                  {data.summary.managersInactive}
                </p>
              </div>
              <div className="border-border bg-surface rounded-xl border p-4">
                <p className="text-fg-subtle text-xs font-semibold tracking-wide">
                  INSTRUCTOR
                </p>
                <p className="text-fg text-2xl font-bold">
                  {data.summary.instructors}{' '}
                  <span className="text-fg-subtle text-xs font-medium">
                    계정
                  </span>
                </p>
                <p className="text-warning flex items-center gap-1 text-xs">
                  <Info className="h-3 w-3" /> 담당 범위 없음{' '}
                  {data.summary.instructorNoScope}명
                </p>
              </div>
              <div className="border-border bg-surface rounded-xl border p-4">
                <p className="text-fg-subtle text-xs font-semibold tracking-wide">
                  MENTOR
                </p>
                <p className="text-fg text-2xl font-bold">
                  {data.summary.mentors}{' '}
                  <span className="text-fg-subtle text-xs font-medium">
                    계정
                  </span>
                </p>
                <p className="text-warning flex items-center gap-1 text-xs">
                  <Info className="h-3 w-3" /> 팀 배정 없음{' '}
                  {data.summary.mentorNoTeam}명
                </p>
              </div>
              <div className="border-border bg-surface rounded-xl border p-4">
                <p className="text-fg-subtle text-xs font-semibold tracking-wide">
                  비활성
                </p>
                <p className="text-fg text-2xl font-bold">
                  {data.summary.inactive}{' '}
                  <span className="text-fg-subtle text-xs font-medium">
                    계정
                  </span>
                </p>
                <p className="text-fg-subtle text-xs">
                  최근 30일 회수 {data.summary.inactiveRevoked30d}건
                </p>
              </div>
            </div>

            {/* 필터 + 검색 */}
            <div className="border-border bg-surface mt-4 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-3">
              <label className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
                <span className="text-fg-subtle">역할</span>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value)
                    setPage(1)
                  }}
                  aria-label="역할 필터"
                  className="text-fg bg-transparent text-sm font-medium outline-none"
                >
                  {roleFilters.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
                <span className="text-fg-subtle">상태</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value)
                    setPage(1)
                  }}
                  aria-label="상태 필터"
                  className="text-fg bg-transparent text-sm font-medium outline-none"
                >
                  {statusFilters.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                placeholder="이메일, 이름, 담당 과정 검색"
                aria-label="운영 계정 검색"
                className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface ml-auto h-9 w-72 rounded-lg border px-3 text-sm outline-none"
              />
            </div>

            <div className="mt-3">
              <DataTable
                columns={columns}
                rows={pagedAccounts}
                rowKey={(a) => a.id}
                onRowClick={(a) => setDetailTarget(a)}
                empty="조건에 맞는 계정이 없어요"
              />
              {filtered.length > 0 && (
                <div className="mt-3">
                  <Pagination
                    page={accountsSafePage}
                    pageCount={accountsPageCount}
                    totalCount={filtered.length}
                    shownCount={pagedAccounts.length}
                    onPage={setPage}
                  />
                </div>
              )}
            </div>
            <div className="text-fg-subtle mt-3 text-xs">
              총 {data.summary.total}건 · 매니저 {data.summary.managers} · 강사{' '}
              {data.summary.instructors} · 멘토 {data.summary.mentors}
            </div>

            {/* 최근 감사 로그 — 설정 허브에서 이전(설정 탭에 유지). */}
            {hub && (
              <div className="border-border bg-surface mt-6 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <div>
                    <p className="text-fg text-sm font-bold">최근 감사 로그</p>
                    <p className="text-fg-subtle text-[11px]">
                      설정 변경 7일 이력 요약 · 전체는 감사 로그 페이지에서
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/settings/audit')}
                    className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium"
                  >
                    전체 로그 <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                {hub.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border-divider flex items-center gap-4 border-t px-5 py-3"
                  >
                    <div className="w-24 shrink-0">
                      <p className="text-fg text-xs font-bold">{log.at}</p>
                      <p className="text-fg-subtle text-[11px]">{log.actor}</p>
                    </div>
                    <span className="bg-surface-muted text-fg-muted shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold">
                      {log.origin}
                    </span>
                    <p className="text-xs">
                      <span className="text-fg font-bold">{log.action}</span>
                      <span className="text-fg-subtle"> · </span>
                      <span className="text-fg-muted">{log.detail}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </DataBoundary>

      <ActionModal
        spec={modal?.spec ?? null}
        onClose={() => setModal(null)}
        onConfirm={onConfirm}
      />

      <TempPasswordModal
        target={
          pwTarget && {
            userId: pwTarget.id,
            name: pwTarget.name,
            detail: pwTarget.email,
          }
        }
        onClose={() => setPwTarget(null)}
      />

      <ScopeModal
        account={scopeTarget}
        onSave={onScopeSave}
        onClose={() => setScopeTarget(null)}
        saving={updateScope.isPending}
      />

      <AccountCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={onCreate}
      />

      <AccountDetailModal
        account={detailTarget}
        role={detailTarget ? detailTarget.role : 'MANAGER'}
        scope={detailTarget ? detailTarget.scope : ''}
        status={detailTarget ? statusOf(detailTarget) : 'active'}
        canEdit={false}
        onClose={() => setDetailTarget(null)}
        onEdit={() => {}}
      />
    </div>
  )
}
