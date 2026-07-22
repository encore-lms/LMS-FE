import { useEffect, useMemo, useState } from 'react'
import { Lock, RefreshCw, Search, TriangleAlert } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import {
  useDisconnectProjectGithub,
  useProjectGithub,
  useSaveProjectGithub,
  useStartProjectGithubInstall,
} from '../../../api/projectGithub'
import type { WorkspaceData } from '../../types'
import type { ProjectGithubStatus } from '../../githubTypes'
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

interface RepoEdit {
  selected: boolean
  branch: string
  pub: boolean
}

/**
 * 프로젝트 설정 — GitHub Organization·Repository 연결(작업 2). PM(OWNER) 전용 편집.
 * 선택 중(로컬 edits)과 서버 저장 상태를 분리한다. GitHub App 설치·레포 목록은 초기 mock.
 */
export function SettingsTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const isOwner = d.isOwner ?? false
  const { data, isPending, isError, refetch } = useProjectGithub(d.id)
  const startM = useStartProjectGithubInstall(d.id)
  const saveM = useSaveProjectGithub(d.id)
  const disconnectM = useDisconnectProjectGithub(d.id)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [edits, setEdits] = useState<Record<number, RepoEdit>>({})

  // 서버 데이터 → 로컬 편집 초기화(저장 전까지 로컬로만 반영)
  useEffect(() => {
    if (!data?.repositories) return
    const init: Record<number, RepoEdit> = {}
    for (const r of data.repositories) {
      init[r.githubRepositoryId] = {
        selected: r.isSelected,
        branch: r.analysisBranch ?? r.defaultBranch ?? '',
        pub: r.isCertificatePublic,
      }
    }
    setEdits(init)
  }, [data])

  const status = data?.status ?? 'DISCONNECTED'
  const connected = status === 'CONNECTED' || status === 'PERMISSION_REQUIRED'
  const repos = data?.repositories ?? []
  const filtered = useMemo(
    () => repos.filter((r) => r.fullName.toLowerCase().includes(query.toLowerCase())),
    [repos, query],
  )
  const selectedCount = Object.values(edits).filter((e) => e.selected).length

  const connect = () => {
    startM.mutate(undefined, {
      onSuccess: () => toast.success('GitHub Organization을 연결했어요'),
      onError: () => toast.danger('GitHub 연결에 실패했어요. 다시 시도해 주세요.'),
    })
  }

  const save = () => {
    const repositories = repos.map((r) => {
      const e = edits[r.githubRepositoryId]
      return {
        githubRepositoryId: r.githubRepositoryId,
        analysisBranch: e?.branch ?? r.defaultBranch ?? '',
        isSelected: e?.selected ?? false,
        isCertificatePublic: e?.pub ?? false,
      }
    })
    saveM.mutate(
      { repositories },
      {
        onSuccess: () => toast.success('GitHub 연결 설정을 저장했어요'),
        onError: () => toast.danger('저장에 실패했어요. 다시 시도해 주세요.'),
      },
    )
  }

  const disconnect = () => {
    disconnectM.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false)
        toast.info('GitHub 연결을 해제했어요')
      },
      onError: () => toast.danger('연결 해제에 실패했어요.'),
    })
  }

  const setEdit = (id: number, patch: Partial<RepoEdit>) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const badge = STATUS_BADGE[status]

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-fg text-[16px] font-bold">프로젝트 설정 · GitHub 연결</h2>
        <span className="text-fg-subtle text-[12px]">
          프로젝트에서 사용하는 GitHub Organization과 Repository를 연결합니다. 연결된
          저장소의 기여도가 증명서에 반영됩니다.
        </span>
      </div>

      {/* PM이 아니면 편집 불가 안내 */}
      {!isOwner && (
        <div className="bg-surface-muted text-fg-muted flex items-center gap-2 rounded-xl p-3 text-[12px]">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          GitHub 연결 설정은 PM(팀장)만 변경할 수 있어요. 아래는 현재 연결 상태입니다.
        </div>
      )}

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
            GitHub App을 설치해 Organization을 연결하면 이 프로젝트에서 사용할 저장소를
            선택할 수 있어요. App은 선택한 저장소에 읽기 권한으로만 접근합니다.
          </span>
          {isOwner && (
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
          )}
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

          {/* 레포 선택 */}
          <section className={cn(card, 'flex flex-col gap-3')}>
            <div className="flex items-center justify-between">
              <span className="text-fg text-[14px] font-bold">
                Repository 선택{' '}
                <span className="text-fg-subtle text-[12px]">
                  {selectedCount}개 선택 · 총 {repos.length}개
                </span>
              </span>
              <label className="border-border text-fg-subtle focus-within:border-brand flex w-56 items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px]">
                <Search className="size-3.5 shrink-0" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="저장소 검색"
                  className="text-fg placeholder:text-fg-subtle w-full bg-transparent focus:outline-none"
                />
              </label>
            </div>

            {filtered.length === 0 ? (
              <Empty
                title="표시할 저장소가 없어요"
                description={
                  repos.length === 0
                    ? '연결된 Organization에 접근 가능한 저장소가 없어요.'
                    : '검색어와 일치하는 저장소가 없어요.'
                }
              />
            ) : (
              <div className="flex flex-col divide-y divide-[color:var(--color-divider)]">
                {filtered.map((r) => {
                  const e = edits[r.githubRepositoryId]
                  const accessible = r.permissionStatus === 'ACCESSIBLE'
                  return (
                    <div key={r.githubRepositoryId} className="flex items-center gap-3 py-3">
                      <input
                        type="checkbox"
                        checked={e?.selected ?? false}
                        disabled={!isOwner || !accessible}
                        onChange={(ev) => setEdit(r.githubRepositoryId, { selected: ev.target.checked })}
                        aria-label={`${r.fullName} 선택`}
                        className="accent-brand size-4 shrink-0"
                      />
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
                          {!accessible && (
                            <span className="bg-danger-bg text-danger rounded px-1.5 py-0.5 text-[10px] font-bold">
                              권한 필요
                            </span>
                          )}
                        </span>
                        <span className="text-fg-subtle text-[11px]">{r.fullName}</span>
                      </div>
                      {/* 분석 브랜치 */}
                      <label className="flex items-center gap-1.5">
                        <span className="text-fg-subtle text-[11px]">브랜치</span>
                        <input
                          value={e?.branch ?? ''}
                          disabled={!isOwner || !e?.selected}
                          onChange={(ev) => setEdit(r.githubRepositoryId, { branch: ev.target.value })}
                          placeholder={r.defaultBranch ?? 'main'}
                          className="border-border text-fg focus:border-brand w-28 rounded-md border px-2 py-1 text-[12px] focus:outline-none disabled:opacity-50"
                        />
                      </label>
                      {/* 증명서 공개 */}
                      <label className="flex items-center gap-1.5 text-[11px]">
                        <input
                          type="checkbox"
                          checked={e?.pub ?? false}
                          disabled={!isOwner || !e?.selected}
                          onChange={(ev) => setEdit(r.githubRepositoryId, { pub: ev.target.checked })}
                          aria-label={`${r.fullName} 증명서 공개`}
                          className="accent-brand size-3.5"
                        />
                        <span className="text-fg-subtle">증명서 공개</span>
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {isOwner && (
            <div className="border-border flex items-center justify-between border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger-bg"
                onClick={() => setConfirmOpen(true)}
              >
                연결 해제
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => connect()} disabled={startM.isPending}>
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  동기화
                </Button>
                <Button variant="primary" size="md" onClick={save} disabled={saveM.isPending}>
                  {saveM.isPending ? '저장 중…' : '변경사항 저장'}
                </Button>
              </div>
            </div>
          )}
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
          <p>연결을 해제하면 이 프로젝트의 저장소 선택·분석 브랜치 설정이 모두 삭제됩니다.</p>
          <p>이미 발급된 증명서는 변경되지 않으며, 언제든 다시 연결할 수 있어요.</p>
        </div>
      </ConfirmDialog>
    </div>
  )
}
