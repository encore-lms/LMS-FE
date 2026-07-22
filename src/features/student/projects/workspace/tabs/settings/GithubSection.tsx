// 설정 탭 — "GitHub 연결" 영역(작업 2: 팀 공통 Org·분석 브랜치 + 개인 증명서 공개).
import { useEffect, useState } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { GithubMark } from '@/components/ui/GithubMark'
import { Button } from '@/components/ui/Button'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Empty } from '@/components/ui/Empty'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import {
  useDisconnectProjectGithub,
  useProjectGithub,
  useSaveMyGithubVisibility,
  useResyncProjectGithub,
  useSaveProjectGithubBranches,
  useStartProjectGithubInstall,
} from '../../../../api/projectGithub'
import type { ProjectGithubStatus } from '../../../githubTypes'
import { card } from '../../components/ws-style'

const STATUS_BADGE: Record<
  ProjectGithubStatus,
  { label: string; tone: BadgeTone }
> = {
  CONNECTED: { label: '연결됨', tone: 'success' },
  INSTALLATION_PENDING: { label: '설치 승인 대기', tone: 'warning' },
  PERMISSION_REQUIRED: { label: '권한 필요', tone: 'danger' },
  DISCONNECTED: { label: '미연결', tone: 'neutral' },
}

export function GithubSection({ projectId }: { projectId: string }) {
  const toast = useToast()
  const { data, isPending, isError, refetch } = useProjectGithub(projectId)
  const startM = useStartProjectGithubInstall(projectId)
  const resyncM = useResyncProjectGithub(projectId)
  const branchesM = useSaveProjectGithubBranches(projectId)
  const visibilityM = useSaveMyGithubVisibility(projectId)
  const disconnectM = useDisconnectProjectGithub(projectId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  // 팀 공통 브랜치(레포별) 로컬 편집
  const [branchEdits, setBranchEdits] = useState<Record<number, string>>({})
  // 개인 공개 로컬 편집
  const [visEdits, setVisEdits] = useState<Record<number, boolean>>({})

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
    window.history.replaceState(
      {},
      '',
      window.location.pathname + (qs ? `?${qs}` : ''),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const status = data?.status ?? 'DISCONNECTED'
  const connected = status === 'CONNECTED' || status === 'PERMISSION_REQUIRED'
  const repos = data?.repositories ?? []
  const badge = STATUS_BADGE[status]

  // 동기화 — 이미 설치된 installation으로 서버가 재동기화(기여도 재집계 포함). 설치 페이지 안 밟음.
  const resync = () =>
    resyncM.mutate(undefined, {
      onSuccess: () => toast.success('GitHub 정보를 다시 불러왔어요'),
      onError: () => toast.danger('동기화에 실패했어요. 다시 시도해 주세요.'),
    })

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
      onError: () =>
        toast.danger('GitHub 연결에 실패했어요. 다시 시도해 주세요.'),
    })

  const saveBranches = () => {
    branchesM.mutate(
      {
        repositories: repos.map((r) => ({
          githubRepositoryId: r.githubRepositoryId,
          analysisBranch:
            branchEdits[r.githubRepositoryId] ?? r.defaultBranch ?? 'main',
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

  return (
    <>
      {/* ── GitHub 연결 ── */}
      <div className="flex flex-col gap-1 pt-2">
        <h2 className="text-fg text-[16px] font-bold">GitHub 연결</h2>
        <span className="text-fg-subtle text-[12px]">
          연결과 분석 브랜치는 팀원 누구나 설정할 수 있어요. 증명서 공개는 팀원
          각자가 자기 증명서에서 고릅니다.
        </span>
      </div>

      {isPending && (
        <div className="bg-surface-muted h-40 animate-pulse rounded-2xl" />
      )}

      {!isPending && isError && (
        <section
          className={cn(
            card,
            'flex flex-col items-center gap-3 py-10 text-center',
          )}
        >
          <TriangleAlert className="text-danger size-7" aria-hidden="true" />
          <span className="text-fg text-[14px] font-bold">
            연결 상태를 불러오지 못했어요
          </span>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            다시 시도
          </Button>
        </section>
      )}

      {/* 미연결 */}
      {!isPending && !isError && !connected && (
        <section
          className={cn(
            card,
            'flex flex-col items-center gap-3 py-10 text-center',
          )}
        >
          <GithubMark className="text-fg size-9" />
          <span className="text-fg text-[15px] font-bold">
            아직 GitHub Organization이 연결되지 않았어요
          </span>
          <span className="text-fg-muted max-w-md text-[12px] leading-5">
            GitHub App을 설치해 Organization을 연결하면 이 프로젝트의 저장소가
            들어옵니다. App은 읽기 권한으로만 접근합니다.
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
              <img
                src={data.organization.avatarUrl}
                alt=""
                className="size-11 shrink-0 rounded-lg"
              />
            ) : (
              <span className="bg-brand inline-flex size-11 shrink-0 items-center justify-center rounded-lg">
                <GithubMark className="size-5 text-white" />
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-fg text-[15px] font-bold">
                {data.organization.displayName ?? data.organization.login}
              </span>
              <span className="text-fg-subtle text-[12px]">
                @{data.organization.login}
              </span>
            </div>
            <StatusBadge label={badge.label} tone={badge.tone} />
          </section>

          {repos.length === 0 ? (
            <Empty
              title="접근 가능한 저장소가 없어요"
              description="연결된 Organization에 접근 가능한 저장소가 없어요."
            />
          ) : (
            <>
              {/* 팀 공통 — 분석 브랜치 */}
              <section className={cn(card, 'flex flex-col gap-3')}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-fg text-[14px] font-bold">
                    분석 브랜치 · 팀 공통
                  </span>
                  <span className="text-fg-subtle text-[12px]">
                    각 저장소에서 기여도를 집계할 브랜치입니다. 팀원 누구나 바꿀
                    수 있어요.
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-[color:var(--color-divider)]">
                  {repos.map((r) => (
                    <div
                      key={r.githubRepositoryId}
                      className="flex items-center gap-3 py-3"
                    >
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
                        <span className="text-fg-subtle text-[11px]">
                          {r.fullName}
                        </span>
                      </div>
                      <label className="flex items-center gap-1.5">
                        <span className="text-fg-subtle text-[11px]">
                          브랜치
                        </span>
                        <Select
                          aria-label={`${r.fullName} 분석 브랜치`}
                          value={
                            branchEdits[r.githubRepositoryId] ??
                            r.defaultBranch ??
                            'main'
                          }
                          onChange={(v) =>
                            setBranchEdits((prev) => ({
                              ...prev,
                              [r.githubRepositoryId]: v,
                            }))
                          }
                          options={r.availableBranches.map((b) => ({
                            value: b,
                            label: b,
                          }))}
                          className="h-9 w-40"
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={saveBranches}
                    disabled={branchesM.isPending}
                  >
                    {branchesM.isPending ? '저장 중…' : '분석 브랜치 저장'}
                  </Button>
                </div>
              </section>

              {/* 개인 — 내 증명서 공개 */}
              <section className={cn(card, 'flex flex-col gap-3')}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-fg text-[14px] font-bold">
                    내 증명서에 공개할 저장소
                  </span>
                  <span className="text-fg-subtle text-[12px]">
                    선택한 저장소의 내 기여가 내 증명서에 노출됩니다. 팀원마다
                    각자 설정합니다.
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
                          setVisEdits((prev) => ({
                            ...prev,
                            [r.githubRepositoryId]: e.target.checked,
                          }))
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
                  <Button
                    variant="primary"
                    size="md"
                    onClick={saveVisibility}
                    disabled={visibilityM.isPending}
                  >
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
            <Button
              variant="secondary"
              size="sm"
              onClick={resync}
              disabled={resyncM.isPending}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              {resyncM.isPending ? '동기화 중…' : '동기화'}
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
          <p>
            연결을 해제하면 이 프로젝트의 저장소·분석 브랜치·팀원 공개 설정이
            모두 삭제됩니다.
          </p>
          <p>
            이미 발급된 증명서는 변경되지 않으며, 언제든 다시 연결할 수 있어요.
          </p>
        </div>
      </ConfirmDialog>
    </>
  )
}
