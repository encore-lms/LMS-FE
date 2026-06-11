import { useMemo, useState } from 'react'
import { AlertTriangle, Clock, Info, KeyRound, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Avatar } from '@/components/ui/Avatar'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { OpsAccount, OpsRole } from '@/shared/types'
import { useOpsAccounts } from '../api/settings'
import { ActionModal, type ActionModalSpec } from './ActionModal'
import { SettingsBreadcrumb } from './SettingsBreadcrumb'
import { SettingsTabs } from './SettingsTabs'

type RoleFilter = 'all' | OpsRole
type StatusFilter = 'all' | 'active' | 'invited' | 'inactive'

const ROLE_TONE: Record<OpsRole, BadgeTone> = {
  MANAGER: 'accent',
  INSTRUCTOR: 'info',
  MENTOR: 'success',
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

const POLICY_ITEMS = [
  { label: '역할 변경', value: '감사 로그 자동 저장' },
  { label: '강사 경고', value: '담당 범위 없을 시 표시' },
  { label: '멘토 경고', value: '팀 배정 §29에서 별도' },
  { label: '본인 권한', value: '매니저 권한 회수 방지' },
  { label: '기본 권한', value: '역할별 RoleAssignment' },
]

// 운영 계정 관리 (/admin/settings/accounts) — 매니저·강사·멘토 계정/권한 관제. (Figma 1284:8597)
// 수정·담당 범위·비번 초기화·비활성화는 운영 액션 모달 v2(1306:8221)로 확인 후 실행.
export default function AccountsPage() {
  const { data, isPending, isError, refetch } = useOpsAccounts()
  const toast = useToast()
  const [role, setRole] = useState<RoleFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<ActionModalSpec | null>(null)
  usePageHeader(
    '운영 설정 · 계정 관리',
    '§3 정본 — 매니저·강사·멘토의 역할·담당 범위·상태를 관리합니다',
  )

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    const needle = q.trim().toLowerCase()
    return items.filter((a) => {
      if (role !== 'all' && a.role !== role) return false
      if (status !== 'all' && a.status !== status) return false
      if (needle) {
        const hay = `${a.name} ${a.email} ${a.scope}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [data, role, status, q])

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="운영 계정을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const { summary } = data

  const openAction = (a: OpsAccount, action: string) => {
    setModal({
      title: `운영 계정 ${action}`,
      subtitle: '역할과 담당 범위를 변경합니다.',
      rows: [
        { label: '계정', value: `${a.name} · ${a.role}` },
        { label: '담당 범위', value: a.scope },
        {
          label: '권한 보호',
          value: a.isSelf ? '본인 매니저 권한 회수 방지' : '해당 없음',
        },
        { label: '감사 로그', value: 'role_assignment_updated 기록' },
      ],
      confirmLabel: '저장',
    })
  }

  const onConfirm = (memo: string) => {
    toast.success('변경 저장 — 감사 로그 기록 (mock)')
    if (memo.trim()) toast.info('매니저 메모가 감사 로그에 함께 기록됐어요')
    setModal(null)
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
      cell: (a) => <StatusBadge label={a.role} tone={ROLE_TONE[a.role]} />,
    },
    {
      key: 'scope',
      header: '담당 범위',
      cell: (a) => (
        <div>
          <span className="text-fg-muted text-sm">{a.scope}</span>
          {a.scopeWarning && (
            <p className="text-warning mt-0.5 flex items-center gap-1 text-xs">
              <Info className="h-3 w-3" /> {a.scopeWarning}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-24',
      cell: (a) => (
        <StatusBadge
          label={STATUS_LABEL[a.status]}
          tone={STATUS_TONE[a.status]}
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
              openAction(a, '수정')
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium"
          >
            수정
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openAction(a, '담당 범위 변경')
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium"
          >
            담당 범위
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toast.success(`${a.name} · 임시 비밀번호 발급 (1회 표시 · 30초)`)
            }}
            className="bg-info-bg text-info hover:bg-info-bg/70 rounded-md px-2 py-1 text-xs font-medium"
          >
            비번 초기화
          </button>
          {a.isSelf ? (
            <span className="text-fg-subtle px-2 py-1 text-xs">
              비활성화 불가
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toast.success(`${a.name} · 비활성화 — 감사 로그 기록 (mock)`)
              }}
              className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2 py-1 text-xs font-medium"
            >
              비활성화
            </button>
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
      <SettingsBreadcrumb
        current="계정 관리"
        route="/admin/settings/accounts"
      />

      {/* 히어로 */}
      <div className="bg-brand mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl px-7 py-5 text-white">
        <div>
          <p className="text-xl font-bold">운영진 계정과 기본 권한 범위 관리</p>
          <p className="mt-1 text-xs">
            §3 정본 — 매니저·강사·멘토의 역할·담당 범위·상태를 관리합니다
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() =>
              toast.info('임시 비밀번호는 발급 시 1회만 표시됩니다')
            }
            className="flex items-center gap-1.5 rounded-lg border border-white px-3.5 py-2 text-xs font-semibold"
          >
            <KeyRound className="h-3.5 w-3.5" /> 임시 비밀번호 보기
          </button>
          <button
            type="button"
            onClick={() =>
              setModal({
                title: '새 계정 추가',
                subtitle: '운영진 계정을 새로 만들고 초대를 보냅니다.',
                rows: [
                  { label: '계정', value: '이메일 초대 — 첫 로그인 시 활성' },
                  { label: '기본 권한', value: '역할별 RoleAssignment 적용' },
                  { label: '담당 범위', value: '생성 후 담당 범위에서 배정' },
                  { label: '감사 로그', value: 'account_created 기록' },
                ],
                confirmLabel: '저장',
              })
            }
            className="text-fg flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold"
          >
            <UserPlus className="h-3.5 w-3.5" /> 새 계정 추가
          </button>
        </div>
      </div>

      <SettingsTabs
        right={
          <>
            <Clock className="h-3 w-3" /> 역할 변경 자동 감사 로그
          </>
        }
      />

      {/* KPI 4 */}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="border-border bg-surface rounded-xl border p-4">
          <p className="text-fg-subtle text-xs font-semibold tracking-wide">
            MANAGER
          </p>
          <p className="text-fg text-2xl font-bold">
            {summary.managers}{' '}
            <span className="text-fg-subtle text-xs font-medium">계정</span>
          </p>
          <p className="text-fg-subtle text-xs">
            활성 {summary.managersActive} · 비활성 {summary.managersInactive}
          </p>
        </div>
        <div className="border-border bg-surface rounded-xl border p-4">
          <p className="text-fg-subtle text-xs font-semibold tracking-wide">
            INSTRUCTOR
          </p>
          <p className="text-fg text-2xl font-bold">
            {summary.instructors}{' '}
            <span className="text-fg-subtle text-xs font-medium">계정</span>
          </p>
          <p className="text-warning flex items-center gap-1 text-xs">
            <Info className="h-3 w-3" /> 담당 범위 없음{' '}
            {summary.instructorNoScope}명
          </p>
        </div>
        <div className="border-border bg-surface rounded-xl border p-4">
          <p className="text-fg-subtle text-xs font-semibold tracking-wide">
            MENTOR
          </p>
          <p className="text-fg text-2xl font-bold">
            {summary.mentors}{' '}
            <span className="text-fg-subtle text-xs font-medium">계정</span>
          </p>
          <p className="text-warning flex items-center gap-1 text-xs">
            <Info className="h-3 w-3" /> 팀 배정 없음 {summary.mentorNoTeam}명 ·
            §29
          </p>
        </div>
        <div className="border-border bg-surface rounded-xl border p-4">
          <p className="text-fg-subtle text-xs font-semibold tracking-wide">
            비활성
          </p>
          <p className="text-fg text-2xl font-bold">
            {summary.inactive}{' '}
            <span className="text-fg-subtle text-xs font-medium">계정</span>
          </p>
          <p className="text-fg-subtle text-xs">
            최근 30일 회수 {summary.inactiveRevoked30d}건
          </p>
        </div>
      </div>

      {/* 필터 + 검색 */}
      <div className="border-border bg-surface mt-4 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-3">
        <label className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
          <span className="text-fg-subtle">역할</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleFilter)}
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
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
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
          onChange={(e) => setQ(e.target.value)}
          placeholder="이메일, 이름, 담당 과정 검색"
          aria-label="운영 계정 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand ml-auto h-9 w-72 rounded-lg border bg-white px-3 text-sm outline-none"
        />
      </div>

      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(a) => a.id}
          onRowClick={(a) => openAction(a, '수정')}
          empty="조건에 맞는 계정이 없어요"
        />
      </div>
      <div className="text-fg-subtle mt-3 text-xs">
        총 {summary.total}건 · 매니저 {summary.managers} · 강사{' '}
        {summary.instructors} · 멘토 {summary.mentors}
      </div>

      {/* 정책 카드 */}
      <div className="bg-info-bg mt-6 flex items-start gap-3.5 rounded-xl p-5">
        <div className="bg-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <Info className="text-info h-5 w-5" />
        </div>
        <div>
          <p className="text-fg text-sm font-bold">
            권한 변경 정책 · §3 완료 기준
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {POLICY_ITEMS.map((p) => (
              <div key={p.label}>
                <p className="text-fg-subtle text-[10px] font-medium">
                  {p.label}
                </p>
                <p className={cn('text-fg text-xs font-bold')}>{p.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ActionModal
        spec={modal}
        onClose={() => setModal(null)}
        onConfirm={onConfirm}
      />
    </div>
  )
}
