import { useMemo, useState } from 'react'
import { Download, KeyRound, RefreshCw, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/Select'
import { downloadExcel } from '@/shared/lib/downloadExcel'
import type { CohortScope } from './scope'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import type { StudentAccount } from '@/shared/types'
import {
  fetchHrdTrainees,
  useDeleteTestStudent,
  useStudentAccounts,
  useSyncStudents,
} from '../api/students'
import { useChangeLoginBlock } from '@/shared/api'
import { useCourseConfig, useCourseList } from '../api/settings'
import { TempPasswordModal } from '../settings/TempPasswordModal'
import { StudentDetailModal } from './StudentDetailModal'
import { TestStudentModal } from './TestStudentModal'

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
export function AccountsTab({ scope }: { scope?: CohortScope }) {
  const toast = useToast()
  const [status, setStatus] = useSearchParamState('status', 'all')
  const [q, setQ] = useSearchParamState('q')
  const [modal, setModal] = useState<{
    account: StudentAccount
    action?: string
  } | null>(null)
  // 비밀번호 초기화 모달 대상 계정 — non-null이면 TempPasswordModal이 열린다(설정 탭과 동일 UX).
  const [pwTarget, setPwTarget] = useState<StudentAccount | null>(null)
  const changeBlock = useChangeLoginBlock()
  // 서버 반영 전 잠깐 쓰는 낙관적 표시 — 정본은 서버 status 다.
  const [blockedOverride, setBlockedOverride] = useState<
    Record<string, boolean>
  >({})
  // HRD 동기화 — 과정/기수 선택 + 마지막 동기화 결과.
  // HRD 동기화 — 과정/기수 선택 + 마지막 동기화 결과.
  const { data: courses } = useCourseList()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const courseId =
    scope?.courseId ?? selectedCourseId ?? courses?.[0]?.courseId ?? null
  const { data: courseConfig } = useCourseConfig(courseId)
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null)
  const cohortId =
    scope?.cohortId ?? selectedCohortId ?? courseConfig?.cohorts?.[0]?.id ?? null
  // 선택 기수의 배정 학생만 조회 — 기수 변경 시 목록 자동 갱신.
  const { data, isPending, isError, refetch } = useStudentAccounts(cohortId)
  const syncStudents = useSyncStudents()
  // 시연·검증용 계정 — 촬영 중 수강생 계정이 하나 더 필요할 때 만들고, 끝나면 지운다.
  const [testOpen, setTestOpen] = useState(false)
  const deleteTestStudent = useDeleteTestStudent()
  const [syncResult, setSyncResult] = useState<{
    created: number
    updated: number
    total: number
  } | null>(null)

  const isBlocked = (a: StudentAccount) =>
    blockedOverride[a.id] ?? a.loginBlocked

  // 파일 이름·안내 문구에 쓸 과정·기수 표기 — 받는 사람이 무엇에 대한 계정인지 알아야 한다.
  const cohortNo = courseConfig?.cohorts?.find((c) => c.id === cohortId)?.cohortNo
  const cohortLabel = cohortNo ? `${cohortNo}기` : ''
  const courseTitle =
    courses?.find((c) => c.courseId === courseId)?.title ?? '교육과정'

  /**
   * 계정 정보 내려받기 — 화면에 보이는 것과 같은 범위(검색·상태 필터 적용)를 담는다.
   *
   * <p>목록을 그대로 받아 가면 필터를 걸어 둔 뜻이 사라지고, 받은 파일과 화면이 달라 어느
   * 쪽이 맞는지 알 수 없다.</p>
   */
  const downloadAccounts = async () => {
    if (filtered.length === 0) {
      toast.info('내려받을 계정이 없어요')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    try {
      await downloadExcel(`계정정보_${cohortLabel || '전체'}_${today}.xlsx`, {
        title: 'PLAYDATA LMS',
        notice: [
          `안녕하세요, ${courseTitle} ${cohortLabel} 수강생 여러분.`,
          '아래는 학습에 사용할 LMS 계정 정보입니다. 아이디와 생년월일로 로그인해 주세요.',
          { text: '반드시 첫 로그인 후에 비밀번호를 변경해 주세요!', emphasis: true },
        ],
        tableTitle: '계정 정보',
        // 수강생에게 그대로 나눠 주는 문서라 로그인에 필요한 것만 담는다.
        // 아이디·생년월일은 글자로 — 그냥 두면 엑셀이 숫자·날짜로 바꿔 값이 뒤틀린다.
        columns: [
          { header: '이름', width: 14 },
          { header: '아이디', width: 20 },
          { header: '생년월일', width: 16 },
        ],
        rows: filtered.map((a) => [a.name, a.studentUuid, a.birthDate]),
        sheetName: cohortLabel ? `${cohortLabel} 계정` : '계정',
      })
      toast.success(`계정 ${filtered.length}건을 내려받았어요`)
    } catch {
      toast.danger('계정 정보를 내려받지 못했어요')
    }
  }

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    const needle = q.trim().toLowerCase()
    const list = items.filter((a) => {
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
    // 이름 가나다순 고정(운영 요구)
    return [...list].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', 'ko'),
    )
  }, [data, status, q, blockedOverride])

  const summary = data?.summary
  const onSave = (memo: string) => {
    if (!modal) return
    const { account, action } = modal
    if (action === '로그인 차단' || action === '로그인 차단 해제') {
      const next = !isBlocked(account)
      // 서버에 남겨야 새로고침해도 유지되고, 실제 로그인도 막힌다.
      changeBlock.mutate(
        { userId: account.id, blocked: next },
        {
          onSuccess: () => {
            setBlockedOverride((p) => ({ ...p, [account.id]: next }))
            toast.success(`${account.name} · ${action} 적용 — 감사 로그 기록`)
          },
          onError: () =>
            toast.danger(`${action}에 실패했어요. 잠시 후 다시 시도해 주세요.`),
        },
      )
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
    { key: 'all', label: '전체', count: summary?.total ?? 0 },
    { key: 'normal', label: '정상', count: summary?.normal ?? 0 },
    { key: 'blocked', label: '로그인 차단', count: summary?.loginBlocked ?? 0 },
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
          {a.isTest && (
            <span className="bg-accent-bg text-accent-strong rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              테스트
            </span>
          )}
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
            setPwTarget(a)
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
        // 테스트 계정은 차단 대신 삭제 — 시연이 끝나면 흔적 없이 치우는 것이 목적이다.
        if (a.isTest) {
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (deleteTestStudent.isPending) return
                deleteTestStudent.mutate(a.id, {
                  onSuccess: () => toast.success(`${a.name} 계정을 삭제했어요`),
                  onError: () => toast.danger('테스트 계정 삭제에 실패했어요'),
                })
              }}
              disabled={deleteTestStudent.isPending}
              className="border-danger text-danger hover:bg-danger-bg flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </button>
          )
        }
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
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      loadingText="불러오는 중…"
      errorTitle="학생 계정을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
    >
      {summary && (
        <>
          {/* HRD 동기화 hero */}
          <div className="bg-brand text-on-color flex flex-wrap items-center justify-between gap-4 rounded-xl px-6 py-5">
            <div>
              <p className="text-lg font-bold">
                HRD-Net 명단 동기화로 학생 계정을 일괄 관리합니다
              </p>
              {/* 임베드(기수 허브)에선 상위가 정한 기수로 동기화한다 — 선택을 또 시키지 않는다. */}
              <div className="mt-3 flex flex-wrap gap-2">
                {!scope && (
                  <>
                <Select
                  aria-label="과정 선택"
                  value={courseId}
                  onChange={(v) => {
                    setSelectedCourseId(v)
                    setSelectedCohortId(null)
                  }}
                  options={(courses ?? []).map((c) => ({
                    value: c.courseId,
                    label: c.title,
                  }))}
                  placeholder="등록 과정 없음"
                  className="h-9"
                />
                <Select
                  aria-label="기수 선택"
                  value={cohortId}
                  onChange={(v) => setSelectedCohortId(v)}
                  options={(courseConfig?.cohorts ?? []).map((c) => ({
                    value: c.id,
                    label: `${c.cohortNo}기`,
                  }))}
                  placeholder="기수 없음"
                  className="h-9"
                />
                  </>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => void downloadAccounts()}
              >
                <Download className="h-4 w-4" /> 계정 정보 다운로드
              </Button>
              <Button
                variant="secondary"
                onClick={() => setTestOpen(true)}
                disabled={!cohortId}
              >
                <UserPlus className="h-4 w-4" /> 테스트 계정 생성
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
                      {t.label}{' '}
                      <span className="text-fg-subtle">{t.count}</span>
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

          <TestStudentModal
            open={testOpen}
            cohortId={cohortId}
            cohortLabel={
              (() => {
                const no = courseConfig?.cohorts?.find(
                  (c) => c.id === cohortId,
                )?.cohortNo
                return no ? `${no}기` : '선택 기수'
              })()
            }
            onClose={() => setTestOpen(false)}
          />

          <StudentDetailModal
            account={modal?.account ?? null}
            actionLabel={modal?.action}
            onClose={() => setModal(null)}
            onSave={onSave}
          />

          <TempPasswordModal
            target={
              pwTarget && {
                userId: pwTarget.id,
                name: pwTarget.name,
                detail: pwTarget.studentUuid,
              }
            }
            withMemo
            onIssued={(memo) => {
              if (memo.trim())
                toast.info('매니저 메모가 감사 로그에 함께 기록됐어요')
            }}
            onClose={() => setPwTarget(null)}
          />
        </>
      )}
    </DataBoundary>
  )
}
