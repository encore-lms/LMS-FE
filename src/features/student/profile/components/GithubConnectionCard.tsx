import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/use-toast'
import {
  useDisconnectGithub,
  useGithubIdentity,
  useStartGithubConnection,
} from '../../api/githubIdentity'
import { profileKeys } from '../queryKeys'
import type { GithubConnectionViewState } from '../githubTypes'
import { ProfileCard } from './ProfileCard'

// GitHub 마크 — lucide는 브랜드 아이콘을 제거해 인라인 SVG로 둔다(currentColor 상속).
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

// 화면 표현 상태 → 배지 톤·라벨. CONNECTING·TEMPORARILY_UNAVAILABLE은 FE 로컬 상태다.
const BADGE: Record<GithubConnectionViewState, { label: string; tone: BadgeTone }> = {
  CONNECTED: { label: '연결됨', tone: 'success' },
  CONNECTING: { label: '연결 진행 중', tone: 'info' },
  REAUTH_REQUIRED: { label: '재인증 필요', tone: 'warning' },
  TEMPORARILY_UNAVAILABLE: { label: '일시적으로 확인 불가', tone: 'danger' },
  DISCONNECTED: { label: '미연결', tone: 'neutral' },
}

function formatKst(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 수강생 개인 GitHub 계정 연결 카드 — 공개 프로필 폼과 별개 도메인(외부 연동)이라 폼 밖 독립 섹션.
 * 닉네임 직접 입력이 아니라 GitHub 인증(전체 페이지 리다이렉트)으로 계정 소유권을 확인한다.
 * 콜백 검증·토큰 교환·githubUserId 저장은 BE가 하고, FE는 토큰을 절대 받지 않는다.
 */
export function GithubConnectionCard() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const { data, isPending, isError, refetch } = useGithubIdentity()
  const startM = useStartGithubConnection()
  const disconnectM = useDisconnectGithub()
  const [confirmOpen, setConfirmOpen] = useState(false)

  // 리다이렉트 복귀 처리 — BE가 /student/profile?github=connected|error 로 되돌려보낸다.
  // 결과를 토스트로 알리고 연결 상태를 재조회한 뒤 쿼리 파라미터를 제거한다.
  const githubResult = params.get('github')
  useEffect(() => {
    if (!githubResult) return
    if (githubResult === 'connected') {
      toast.success('GitHub 계정을 연결했어요')
      queryClient.invalidateQueries({ queryKey: profileKeys.githubIdentity() })
    } else if (githubResult === 'error') {
      toast.danger('GitHub 연결에 실패했어요. 다시 시도해 주세요.')
    }
    const next = new URLSearchParams(params)
    next.delete('github')
    setParams(next, { replace: true })
    // params/setParams는 안정적이지 않아 deps에서 제외(githubResult 변화로만 실행).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubResult])

  const startConnect = () => {
    startM.mutate(undefined, {
      onSuccess: (res) => {
        // state는 CSRF 방어용 — BE가 콜백에서 검증. FE는 왕복 확인용으로만 보관.
        sessionStorage.setItem('github-oauth-state', res.state)
        window.location.href = res.authorizeUrl
      },
      onError: () =>
        toast.danger('GitHub 인증을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.'),
    })
  }

  const disconnect = () => {
    disconnectM.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false)
        toast.info('GitHub 연결을 해제했어요')
      },
      onError: () => toast.danger('연결 해제에 실패했어요. 다시 시도해 주세요.'),
    })
  }

  // 서버 상태 + 진행/오류 로컬 상태를 화면 표현 상태로 합성.
  const view: GithubConnectionViewState = startM.isPending
    ? 'CONNECTING'
    : isError
      ? 'TEMPORARILY_UNAVAILABLE'
      : (data?.status ?? 'DISCONNECTED')

  const badge = BADGE[view]
  const connected = view === 'CONNECTED' || view === 'REAUTH_REQUIRED'

  return (
    <ProfileCard
      title={
        <span className="flex items-center gap-2">
          <GithubMark className="size-[18px]" />
          GitHub 계정 연결
        </span>
      }
      description="수강 역량 증명서의 개인 기여도 확인에 사용됩니다. GitHub 인증으로 계정 소유권을 확인하며, 토큰은 저장하지 않습니다."
    >
      <div className="flex items-center justify-between gap-3">
        <StatusBadge label={badge.label} tone={badge.tone} />
      </div>

      {/* 조회 중 */}
      {isPending && (
        <div className="bg-surface-muted h-16 animate-pulse rounded-lg" />
      )}

      {/* 일시적 오류 */}
      {!isPending && view === 'TEMPORARILY_UNAVAILABLE' && (
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <span className="text-fg-muted flex items-center gap-2 text-[13px]">
            <TriangleAlert className="text-danger size-4" aria-hidden="true" />
            연결 상태를 확인하지 못했어요.
          </span>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            다시 확인
          </Button>
        </div>
      )}

      {/* 미연결 */}
      {!isPending && (view === 'DISCONNECTED' || view === 'CONNECTING') && (
        <div className="flex flex-col gap-3">
          <p className="text-fg-muted text-[13px] leading-5">
            GitHub 계정을 연결하면 프로젝트 저장소에서 본인의 기여도를 증명서에
            반영할 수 있어요. 연결 후에도 언제든 해제할 수 있습니다.
          </p>
          <Button
            variant="primary"
            size="md"
            className="w-fit"
            onClick={startConnect}
            disabled={startM.isPending}
          >
            <GithubMark className="size-4" />
            {startM.isPending ? 'GitHub로 이동 중…' : 'GitHub 계정 연결'}
          </Button>
        </div>
      )}

      {/* 연결됨 / 재인증 필요 */}
      {!isPending && connected && data && (
        <div className="flex flex-col gap-4">
          {view === 'REAUTH_REQUIRED' && (
            <div className="bg-warning-bg text-warning flex items-start gap-2 rounded-lg p-3 text-[13px] leading-5">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              연결이 만료되었어요. 기여도 최신화를 계속하려면 다시 인증해 주세요.
            </div>
          )}
          <div className="flex items-center gap-3">
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt=""
                className="size-11 shrink-0 rounded-full"
              />
            ) : (
              <span className="bg-brand inline-flex size-11 shrink-0 items-center justify-center rounded-full">
                <GithubMark className="size-5 text-white" />
              </span>
            )}
            <div className="flex min-w-0 flex-col">
              <a
                href={data.profileUrl ?? undefined}
                target="_blank"
                rel="noreferrer noopener"
                className="text-fg hover:text-brand truncate text-[15px] font-bold"
              >
                @{data.githubLogin}
              </a>
              <span className="text-fg-subtle text-[12px]">
                GitHub 사용자 ID {data.githubUserId}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex flex-col">
              <dt className="text-fg-subtle text-[11px]">연결 완료</dt>
              <dd className="text-fg text-[13px] font-medium">
                {formatKst(data.connectedAt)}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-fg-subtle text-[11px]">마지막 확인</dt>
              <dd className="text-fg text-[13px] font-medium">
                {formatKst(data.verifiedAt)}
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={startConnect}
              disabled={startM.isPending}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              다시 인증
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger-bg"
              onClick={() => setConfirmOpen(true)}
            >
              연결 해제
            </Button>
          </div>
        </div>
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
          <p>연결을 해제하면 앞으로의 기여도 최신화가 중단됩니다.</p>
          <p>
            이미 발급된 증명서는 변경되지 않으며, 기존 데이터도 즉시 삭제되지
            않습니다. 언제든 다시 연결할 수 있어요.
          </p>
        </div>
      </ConfirmDialog>
    </ProfileCard>
  )
}
