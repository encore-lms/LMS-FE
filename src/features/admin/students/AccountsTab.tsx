import { useMemo, useState } from 'react'
import { AlertTriangle, Download, KeyRound, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import type { StudentAccount } from '@/shared/types'
import {
  fetchHrdTrainees,
  useResetStudentPassword,
  useStudentAccounts,
  useSyncStudents,
} from '../api/students'
import { useCourseConfig, useCourseList } from '../api/settings'
import { StudentDetailModal } from './StudentDetailModal'

type StatusFilter = 'all' | 'normal' | 'blocked'

function accountBadge(
  a: StudentAccount,
  blocked: boolean,
): { label: string; tone: BadgeTone } {
  if (a.trainingStatus === 'dropout')
    return { label: '중도탈락', tone: 'danger' }
  if (blocked) return { label: '로그인 차단', tone: 'danger' }
  return { label: '정상', tone: 'success' }
}

// 계정 탭 — HRD 동기화 + 계정 관제 테이블 + 학생 계정 상세 모달. (Figma 1457:10648)
export function AccountsTab() {
  const toast = useToast()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<{
    account: StudentAccount
    action?: string
  } | null>(null)
  // 차단/해제 낙관적 반영 — mock이라 영속 없음(새로고침 초기화).
  const [blockedOverride, setBlockedOverride] = useState<
    Record<string, boolean>
  >({})
  // HRD 동기화 — 과정/기수 선택 + 마지막 동기화 결과.
  const { data: courses } = useCourseList()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const courseId = selectedCourseId ?? courses?.[0]?.courseId ?? null
  const { data: courseConfig } = useCourseConfig(courseId)
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null)
  const cohortId = selectedCohortId ?? courseConfig?.cohorts?.[0]?.id ?? null
  // 선택 기수의 배정 학생만 조회 — 기수 변경 시 목록 자동 갱신.
  const { data, isPending, isError, refetch } = useStudentAccounts(cohortId)
  const syncStudents = useSyncStudents()
  const resetPw = useResetStudentPassword()
  const [syncResult, setSyncResult] = useState<{
    created: number
    updated: number
    total: number
  } | null>(null)

  const isBlocked = (a: StudentAccount) =>
    blockedOverride[a.id] ?? a.loginBlocked

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    const needle = q.trim().toLowerCase()
    return items.filter((a) => {
      const blocked = blockedOverride[a.id] ?? a.loginBlocked
      if (status === 'blocked' && !blocked) return false
      if (status === 'normal' && (blocked || a.trainingStatus === 'dropout'))
        return false
      if (needle) {
        const hay = `${a.name} ${a.studentUuid} ${a.birthDate}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [data, status, q, blockedOverride])

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="학생 계정을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const { summary } = data
  const onSave = (memo: string) => {
    if (!modal) return
    const { account, action } = modal
    if (action === '로그인 차단' || action === '로그인 차단 해제') {
      setBlockedOverride((p) => ({ ...p, [account.id]: !isBlocked(account) }))
      toast.success(`${account.name} · ${action} 적용 — 감사 로그 기록`)
    } else if (action === '비밀번호 초기화') {
      resetPw.mutate(account.id, {
        onSuccess: (r) =>
          toast.success(
            `${account.name} · 임시 비밀번호 ${r.temporaryPassword} (1회 표시)`,
          ),
        onError: () => toast.danger('비밀번호 초기화에 실패했어요'),
      })
    } else {
      toast.success(`${account.name} · 변경 저장 — 감사 로그 기록`)
    }
    if (memo.trim()) toast.info('매니저 메모가 감사 로그에 함께 기록됐어요')
    setModal(null)
  }

  // 계정 갱신 — 선택 회차의 HRD 훈련생 명단을 가져와 계정에 동기화.
  const onRefresh = async () => {
    if (!courseId || !cohortId) {
      toast.danger('과정과 기수를 먼저 선택해 주세요')
      return
    }
    try {
      const trainees = await fetchHrdTrainees(courseId, cohortId)
      if (trainees.length === 0) {
        toast.info('해당 회차의 HRD 훈련생 명단이 비어 있어요')
        return
      }
      const result = await syncStudents.mutateAsync({
        cohortId,
        students: trainees.map((t) => ({
          studentUuid: t.studentUuid,
          name: t.name,
          birth: t.birth,
        })),
      })
      setSyncResult(result)
      toast.success(
        `HRD 동기화 완료 — 생성 ${result.created} / 갱신 ${result.updated} / 총 ${result.total}`,
      )
    } catch {
      toast.danger('HRD 동기화에 실패했어요 (기관 소유 회차인지 확인)')
    }
  }

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: summary.total },
    { key: 'normal', label: '정상', count: summary.normal },
    { key: 'blocked', label: '로그인 차단', count: summary.loginBlocked },
  ]

  const columns: Column<StudentAccount>[] = [
    {
      key: 'name',
      header: '이름',
      className: 'w-40',
      cell: (a) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={a.name} size={30} />
          <span className="text-fg font-medium">{a.name}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (a) => {
        const b = accountBadge(a, isBlocked(a))
        return <StatusBadge label={b.label} tone={b.tone} />
      },
    },
    {
      key: 'uuid',
      header: '학생 UUID',
      cell: (a) => (
        <span className="text-fg-muted font-mono text-xs">{a.studentUuid}</span>
      ),
    },
    {
      key: 'birth',
      header: '생년월일',
      cell: (a) => <span className="text-fg-muted">{a.birthDate}</span>,
    },
    {
      key: 'joined',
      header: '가입일',
      cell: (a) => <span className="text-fg-muted">{a.joinedAt}</span>,
    },
    {
      key: 'lastLogin',
      header: '마지막 로그인',
      cell: (a) => (
        <span className="text-fg-muted">{a.lastLoginAt ?? '미접속'}</span>
      ),
    },
    {
      key: 'password',
      header: '비밀번호',
      className: 'w-24',
      cell: (a) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setModal({ account: a, action: '비밀번호 초기화' })
          }}
          className="bg-info-bg text-info hover:bg-info-bg/70 rounded-md px-2.5 py-1 text-xs font-medium"
        >
          초기화
        </button>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      className: 'w-28',
      cell: (a) => {
        const blocked = isBlocked(a)
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setModal({
                account: a,
                action: blocked ? '로그인 차단 해제' : '로그인 차단',
              })
            }}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-medium',
              blocked
                ? 'border-success text-success hover:bg-success-bg'
                : 'border-border text-fg-muted hover:bg-surface-muted',
            )}
          >
            {blocked ? '차단 해제' : '차단'}
          </button>
        )
      },
    },
  ]

  return (
    <>
      {/* HRD 동기화 hero */}
      <div className="bg-brand text-on-color flex flex-wrap items-center justify-between gap-4 rounded-xl px-6 py-5">
        <div>
          <p className="text-lg font-bold">
            HRD-Net 명단 동기화로 학생 계정을 일괄 관리합니다
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              aria-label="과정 선택"
              value={courseId ?? ''}
              onChange={(e) => {
                setSelectedCourseId(e.target.value)
                setSelectedCohortId(null)
              }}
              className="text-fg bg-surface h-9 rounded-lg px-3 text-sm outline-none"
            >
              {(courses ?? []).map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.title}
                </option>
              ))}
              {(courses ?? []).length === 0 && (
                <option value="">등록 과정 없음</option>
              )}
            </select>
            <select
              aria-label="기수 선택"
              value={cohortId ?? ''}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="text-fg bg-surface h-9 rounded-lg px-3 text-sm outline-none"
            >
              {(courseConfig?.cohorts ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cohortNo}기
                </option>
              ))}
              {(courseConfig?.cohorts ?? []).length === 0 && (
                <option value="">기수 없음</option>
              )}
            </select>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              toast.info('수강생_계정정보_22기.xls 내려받기 (mock)')
            }
          >
            <Download className="h-4 w-4" /> 계정 정보 다운로드
          </Button>
          <Button
            variant="secondary"
            onClick={onRefresh}
            disabled={syncStudents.isPending}
          >
            <RefreshCw className="h-4 w-4" /> 계정 갱신 — HRD 동기화
          </Button>
        </div>
      </div>

      <div className="text-fg-subtle mt-2 flex items-center justify-end gap-1 text-xs">
        <RefreshCw className="text-success h-3 w-3" />
        {syncResult
          ? `방금 HRD 동기화 · 생성 ${syncResult.created} / 갱신 ${syncResult.updated} / 총 ${syncResult.total}`
          : `총 ${summary.total}명 · 계정 갱신으로 HRD 명단 동기화`}
      </div>

      {summary.total === 0 ? (
        /* 선택 기수에 등록된 수강생이 없을 때 — 계정 갱신 안내 */
        <div className="mt-4">
          <Empty
            icon={<RefreshCw className="h-6 w-6" />}
            title="등록된 수강생이 없어요"
            description="아직 이 기수에 계정이 등록되지 않았어요. 위 ‘계정 갱신 — HRD 동기화’로 수강생 계정을 등록해 주세요."
            action={
              <Button onClick={onRefresh} disabled={syncStudents.isPending}>
                <RefreshCw className="h-4 w-4" /> 계정 갱신 — HRD 동기화
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* 상태 필터 + 검색 */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1">
              {statusTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setStatus(t.key)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium',
                    status === t.key
                      ? 'bg-accent-bg text-accent-strong'
                      : 'text-fg-muted hover:bg-surface-muted',
                  )}
                >
                  {t.label} <span className="text-fg-subtle">{t.count}</span>
                </button>
              ))}
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="이름·UUID·생년월일 검색"
              aria-label="학생 계정 검색"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-9 w-64 rounded-lg border px-3 text-sm outline-none"
            />
          </div>

          <div className="mt-3">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(a) => a.id}
              onRowClick={(a) => setModal({ account: a })}
              empty="조건에 맞는 학생이 없어요"
            />
          </div>
          <div className="text-fg-subtle mt-3 flex items-center gap-1 text-xs">
            <KeyRound className="h-3 w-3" />총 {summary.total}명 · 정상{' '}
            {summary.normal} · 로그인 차단 {summary.loginBlocked}
          </div>
        </>
      )}

      <StudentDetailModal
        account={modal?.account ?? null}
        actionLabel={modal?.action}
        onClose={() => setModal(null)}
        onSave={onSave}
      />
    </>
  )
}
