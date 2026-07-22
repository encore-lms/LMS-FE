import { useEffect, useState } from 'react'
import { Lock, RefreshCw, TriangleAlert } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Empty } from '@/components/ui/Empty'
import { Select } from '@/components/ui/Select'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import {
  useDisconnectProjectGithub,
  useProjectGithub,
  useSaveMyGithubVisibility,
  useSaveProjectGithubBranches,
  useStartProjectGithubInstall,
} from '../../../api/projectGithub'
import {
  useUpdateProjectInfo,
  useUpdateProjectTechStacks,
  wsWriteError,
} from '../../../api/projects'
import type { WorkspaceData } from '../../types'
import type { ProjectGithubStatus } from '../../githubTypes'
import { Field } from '../../wizard/wizardShared'
import { StackPicker } from '../components/StackPicker'
import { card } from '../components/ws-style'

// GitHub 마크 — lucide는 브랜드 아이콘을 제거해 인라인 SVG로 둔다.
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

const STATUS_BADGE: Record<ProjectGithubStatus, { label: string; tone: BadgeTone }> = {
  CONNECTED: { label: '연결됨', tone: 'success' },
  INSTALLATION_PENDING: { label: '설치 승인 대기', tone: 'warning' },
  PERMISSION_REQUIRED: { label: '권한 필요', tone: 'danger' },
  DISCONNECTED: { label: '미연결', tone: 'neutral' },
}

/**
 * 프로젝트 설정 탭.
 * · 프로젝트 정보: 이름·기간(PM 전용), 기술 카테고리(팀원 누구나). 인증 완료면 잠금.
 * · GitHub 연결(작업 2): 팀 공통 Org·분석 브랜치 + 개인 증명서 공개.
 */
export function SettingsTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const { data, isPending, isError, refetch } = useProjectGithub(d.id)
  const startM = useStartProjectGithubInstall(d.id)
  const branchesM = useSaveProjectGithubBranches(d.id)
  const visibilityM = useSaveMyGithubVisibility(d.id)
  const disconnectM = useDisconnectProjectGithub(d.id)
  const [confirmOpen, setConfirmOpen] = useState(false)
  // 팀 공통 브랜치(레포별) 로컬 편집
  const [branchEdits, setBranchEdits] = useState<Record<number, string>>({})
  // 개인 공개 로컬 편집
  const [visEdits, setVisEdits] = useState<Record<number, boolean>>({})

  // ── 프로젝트 정보 편집 ──
  const infoM = useUpdateProjectInfo(d.id)
  const techM = useUpdateProjectTechStacks(d.id)
  const isPm = d.isOwner === true
  const locked = d.status === 'certified' // 인증 완료면 이름·기간·기술 잠금(인증 전만 편집)
  const [name, setName] = useState(d.title)
  const [start, setStart] = useState(d.startDate ?? '')
  const [end, setEnd] = useState(d.endDate ?? '')
  const [stacks, setStacks] = useState<string[]>(d.stack)

  // 워크스페이스 데이터 갱신 시 편집 폼 초기화(저장 후 재조회 반영).
  useEffect(() => {
    setName(d.title)
    setStart(d.startDate ?? '')
    setEnd(d.endDate ?? '')
    setStacks(d.stack)
  }, [d.title, d.startDate, d.endDate, d.stack])

  const toggleStack = (s: string) =>
    setStacks((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )

  const saveInfo = () => {
    if (!name.trim()) {
      toast.danger('프로젝트 이름을 입력해 주세요.')
      return
    }
    infoM.mutate(
      { title: name.trim(), start: start || undefined, end: end || undefined },
      {
        onSuccess: () => toast.success('프로젝트 정보를 저장했어요'),
        onError: (e) => toast.danger(wsWriteError(e, '저장에 실패했어요.')),
      },
    )
  }

  const saveStacks = () => {
    techM.mutate(
      { stacks },
      {
        onSuccess: () => toast.success('기술 카테고리를 저장했어요'),
        onError: (e) => toast.danger(wsWriteError(e, '저장에 실패했어요.')),
      },
    )
  }

  useEffect(() => {
    if (!data?.repositories) return
    const b: Record<number, string> = {}
    const v: Record<number, boolean> = {}
    for (const r of data.repositories) {
      b[r.githubRepositoryId] = r.analysisBranch ?? r.defaultBranch ?? 'main'
      v[r.githubRepositoryId] = r.isPublicForMe
    }
    setBranchEdits(b)
    setVisEdits(v)
  }, [data])

  // 설치 콜백 복귀(?github=connected|error) — 토스트 + 재조회 후 github 쿼리만 정리(tab 등은 유지).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gh = params.get('github')
    if (!gh) return
    if (gh === 'connected') {
      toast.success('GitHub Organization을 연결했어요')
      refetch()
    } else if (gh === 'error') {
      toast.danger('GitHub 연결에 실패했어요. 다시 시도해 주세요.')
    }
    params.delete('github')
    const qs = params.toString()
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const status = data?.status ?? 'DISCONNECTED'
  const connected = status === 'CONNECTED' || status === 'PERMISSION_REQUIRED'
  const repos = data?.repositories ?? []
  const badge = STATUS_BADGE[status]

  const connect = () =>
    startM.mutate(undefined, {
      onSuccess: (data) => {
        if (!data.installed && data.installUrl) {
          // 실 연동 — GitHub App 설치 페이지로 이동. 설치 후 콜백이 이 화면(?github=)으로 돌려보낸다.
          window.location.href = data.installUrl
          return
        }
        // mock 폴백(로컬·미배포) — 즉시 연결.
        toast.success('GitHub Organization을 연결했어요')
      },
      onError: () => toast.danger('GitHub 연결에 실패했어요. 다시 시도해 주세요.'),
    })

  const saveBranches = () => {
    branchesM.mutate(
      {
        repositories: repos.map((r) => ({
          githubRepositoryId: r.githubRepositoryId,
          analysisBranch: branchEdits[r.githubRepositoryId] ?? r.defaultBranch ?? 'main',
          isSelected: r.isSelected,
        })),
      },
      {
        onSuccess: () => toast.success('분석 브랜치를 저장했어요'),
        onError: () => toast.danger('브랜치 저장에 실패했어요.'),
      },
    )
  }

  const saveVisibility = () => {
    visibilityM.mutate(
      {
        repositories: repos.map((r) => ({
          githubRepositoryId: r.githubRepositoryId,
          isPublic: visEdits[r.githubRepositoryId] ?? false,
        })),
      },
      {
        onSuccess: () => toast.success('증명서 공개 설정을 저장했어요'),
        onError: () => toast.danger('저장에 실패했어요.'),
      },
    )
  }

  const disconnect = () =>
    disconnectM.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false)
        toast.info('GitHub 연결을 해제했어요')
      },
      onError: () => toast.danger('연결 해제에 실패했어요.'),
    })

  const infoInput =
    'border-border bg-surface text-fg focus:border-brand w-full rounded-[10px] border px-4 py-3 text-[14px] focus:outline-none disabled:opacity-60'

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* ── 프로젝트 정보 ── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-fg text-[16px] font-bold">프로젝트 정보</h2>
        <span className="text-fg-subtle text-[12px]">
          이름·기간은 PM만, 기술 카테고리는 팀원 누구나 수정할 수 있어요.
        </span>
      </div>

      {locked && (
        <div className="bg-surface-muted text-fg-muted flex items-center gap-2 rounded-xl px-4 py-3 text-[12px]">
          <Lock className="size-3.5 shrink-0" aria-hidden="true" />
          인증이 완료된 프로젝트는 정보를 수정할 수 없어요. 수정이 필요하면 강사에게 요청해 주세요.
        </div>
      )}

      {/* 이름·기간 — PM 전용 */}
      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex items-center justify-between">
          <span className="text-fg text-[14px] font-bold">이름 · 기간</span>
          {!isPm && (
            <span className="text-fg-subtle text-[11px]">PM만 수정 가능</span>
          )}
        </div>
        <Field label="프로젝트명" required counter={`${name.length} / 80`}>
          <input
            className={infoInput}
            maxLength={80}
            value={name}
            disabled={!isPm || locked}
            onChange={(e) => setName(e.target.value)}
            aria-label="프로젝트명"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="시작일">
            <DateTimePicker
              mode="date"
              value={start}
              onChange={setStart}
              ariaLabel="시작일"
              placeholder="시작일"
              max={end || undefined}
              disabled={!isPm || locked}
            />
          </Field>
          <Field label="종료일">
            <DateTimePicker
              mode="date"
              value={end}
              onChange={setEnd}
              ariaLabel="종료일"
              placeholder="종료일"
              min={start || undefined}
              disabled={!isPm || locked}
            />
          </Field>
        </div>
        {isPm && !locked && (
          <div className="flex justify-end">
            <Button variant="primary" size="md" onClick={saveInfo} disabled={infoM.isPending}>
              {infoM.isPending ? '저장 중…' : '이름·기간 저장'}
            </Button>
          </div>
        )}
      </section>

      {/* 기술 카테고리 — 팀원 누구나 */}
      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[14px] font-bold">기술 카테고리</span>
          <span className="text-fg-subtle text-[12px]">
            프로젝트가 사용하는 기술 스택입니다. 팀원 누구나 바꿀 수 있어요.
          </span>
        </div>
        <StackPicker value={stacks} onToggle={toggleStack} disabled={locked} />
        {!locked && (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={saveStacks} disabled={techM.isPending}>
              {techM.isPending ? '저장 중…' : '기술 카테고리 저장'}
            </Button>
          </div>
        )}
      </section>

      {/* ── GitHub 연결 ── */}
      <div className="flex flex-col gap-1 pt-2">
        <h2 className="text-fg text-[16px] font-bold">GitHub 연결</h2>
        <span className="text-fg-subtle text-[12px]">
          연결과 분석 브랜치는 팀원 누구나 설정할 수 있어요. 증명서 공개는 팀원 각자가 자기
          증명서에서 고릅니다.
        </span>
      </div>

      {isPending && <div className="bg-surface-muted h-40 animate-pulse rounded-2xl" />}

      {!isPending && isError && (
        <section className={cn(card, 'flex flex-col items-center gap-3 py-10 text-center')}>
          <TriangleAlert className="text-danger size-7" aria-hidden="true" />
          <span className="text-fg text-[14px] font-bold">연결 상태를 불러오지 못했어요</span>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            다시 시도
          </Button>
        </section>
      )}

      {/* 미연결 */}
      {!isPending && !isError && !connected && (
        <section className={cn(card, 'flex flex-col items-center gap-3 py-10 text-center')}>
          <GithubMark className="text-fg size-9" />
          <span className="text-fg text-[15px] font-bold">
            아직 GitHub Organization이 연결되지 않았어요
          </span>
          <span className="text-fg-muted max-w-md text-[12px] leading-5">
            GitHub App을 설치해 Organization을 연결하면 이 프로젝트의 저장소가 들어옵니다. App은
            읽기 권한으로만 접근합니다.
          </span>
          <Button
            variant="primary"
            size="md"
            className="mt-1"
            onClick={connect}
            disabled={startM.isPending}
          >
            <GithubMark className="size-4" />
            {startM.isPending ? '연결 중…' : 'GitHub 연결'}
          </Button>
        </section>
      )}

      {/* 연결됨 */}
      {!isPending && !isError && connected && data?.organization && (
        <>
          {/* Org 헤더 */}
          <section className={cn(card, 'flex items-center gap-3')}>
            {data.organization.avatarUrl ? (
              <img src={data.organization.avatarUrl} alt="" className="size-11 shrink-0 rounded-lg" />
            ) : (
              <span className="bg-brand inline-flex size-11 shrink-0 items-center justify-center rounded-lg">
                <GithubMark className="size-5 text-white" />
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-fg text-[15px] font-bold">
                {data.organization.displayName ?? data.organization.login}
              </span>
              <span className="text-fg-subtle text-[12px]">@{data.organization.login}</span>
            </div>
            <StatusBadge label={badge.label} tone={badge.tone} />
          </section>

          {repos.length === 0 ? (
            <Empty title="접근 가능한 저장소가 없어요" description="연결된 Organization에 접근 가능한 저장소가 없어요." />
          ) : (
            <>
              {/* 팀 공통 — 분석 브랜치 */}
              <section className={cn(card, 'flex flex-col gap-3')}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-fg text-[14px] font-bold">분석 브랜치 · 팀 공통</span>
                  <span className="text-fg-subtle text-[12px]">
                    각 저장소에서 기여도를 집계할 브랜치입니다. 팀원 누구나 바꿀 수 있어요.
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-[color:var(--color-divider)]">
                  {repos.map((r) => (
                    <div key={r.githubRepositoryId} className="flex items-center gap-3 py-3">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-fg flex items-center gap-1.5 text-[13px] font-semibold">
                          {r.name}
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-bold',
                              r.visibility === 'PRIVATE'
                                ? 'bg-warning-bg text-warning'
                                : 'bg-surface-muted text-fg-muted',
                            )}
                          >
                            {r.visibility === 'PRIVATE' ? 'Private' : 'Public'}
                          </span>
                        </span>
                        <span className="text-fg-subtle text-[11px]">{r.fullName}</span>
                      </div>
                      <label className="flex items-center gap-1.5">
                        <span className="text-fg-subtle text-[11px]">브랜치</span>
                        <Select
                          aria-label={`${r.fullName} 분석 브랜치`}
                          value={branchEdits[r.githubRepositoryId] ?? r.defaultBranch ?? 'main'}
                          onChange={(v) =>
                            setBranchEdits((prev) => ({ ...prev, [r.githubRepositoryId]: v }))
                          }
                          options={r.availableBranches.map((b) => ({ value: b, label: b }))}
                          className="h-9 w-40"
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button variant="secondary" size="sm" onClick={saveBranches} disabled={branchesM.isPending}>
                    {branchesM.isPending ? '저장 중…' : '분석 브랜치 저장'}
                  </Button>
                </div>
              </section>

              {/* 개인 — 내 증명서 공개 */}
              <section className={cn(card, 'flex flex-col gap-3')}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-fg text-[14px] font-bold">내 증명서에 공개할 저장소</span>
                  <span className="text-fg-subtle text-[12px]">
                    선택한 저장소의 내 기여가 내 증명서에 노출됩니다. 팀원마다 각자 설정합니다.
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-[color:var(--color-divider)]">
                  {repos.map((r) => (
                    <label
                      key={r.githubRepositoryId}
                      className="flex cursor-pointer items-center gap-3 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={visEdits[r.githubRepositoryId] ?? false}
                        onChange={(e) =>
                          setVisEdits((prev) => ({ ...prev, [r.githubRepositoryId]: e.target.checked }))
                        }
                        aria-label={`${r.fullName} 증명서 공개`}
                        className="accent-brand size-4 shrink-0"
                      />
                      <span className="text-fg min-w-0 flex-1 truncate text-[13px] font-semibold">
                        {r.name}
                      </span>
                      <span className="text-fg-subtle shrink-0 text-[12px]">
                        내 커밋 {r.myCommits} · 기여 {r.myContribPercent}%
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button variant="primary" size="md" onClick={saveVisibility} disabled={visibilityM.isPending}>
                    {visibilityM.isPending ? '저장 중…' : '내 공개 설정 저장'}
                  </Button>
                </div>
              </section>
            </>
          )}

          <div className="border-border flex items-center justify-between border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger-bg"
              onClick={() => setConfirmOpen(true)}
            >
              연결 해제
            </Button>
            <Button variant="secondary" size="sm" onClick={connect} disabled={startM.isPending}>
              <RefreshCw className="size-3.5" aria-hidden="true" />
              동기화
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={disconnect}
        title="GitHub 연결을 해제할까요?"
        confirmLabel={disconnectM.isPending ? '해제 중…' : '연결 해제'}
        tone="danger"
        confirmDisabled={disconnectM.isPending}
      >
        <div className="text-fg-muted flex flex-col gap-2 text-[13px] leading-5">
          <p>연결을 해제하면 이 프로젝트의 저장소·분석 브랜치·팀원 공개 설정이 모두 삭제됩니다.</p>
          <p>이미 발급된 증명서는 변경되지 않으며, 언제든 다시 연결할 수 있어요.</p>
        </div>
      </ConfirmDialog>
    </div>
  )
}
