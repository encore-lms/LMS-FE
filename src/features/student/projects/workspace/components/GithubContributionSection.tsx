import { useEffect, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { useProjectGithub } from '../../../api/projectGithub'
import type { ProjectGithubContributor } from '../../githubTypes'
import { card } from './ws-style'

// GitHub 마크 — 기여도 섹션 헤더용.
function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

const CHART_TONES = [
  'bg-brand',
  'bg-info',
  'bg-accent-strong',
  'bg-warning',
  'bg-success',
  'bg-danger',
]

function ContributorRow({
  c,
  index,
}: {
  c: ProjectGithubContributor
  index: number
}) {
  const initial = (c.name || c.githubLogin || '?').slice(0, 1).toUpperCase()
  return (
    <div className="flex items-center gap-3 py-2.5">
      {c.avatarUrl ? (
        <img
          src={c.avatarUrl}
          alt=""
          className="size-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white',
            CHART_TONES[index % CHART_TONES.length],
          )}
        >
          {initial}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-fg truncate text-[13px] font-semibold">
            {c.name}
          </span>
          {c.isLmsUser ? (
            <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-bold">
              LMS
            </span>
          ) : (
            <span className="text-fg-subtle truncate text-[11px]">
              @{c.githubLogin}
            </span>
          )}
        </div>
        <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              'h-full rounded-full',
              CHART_TONES[index % CHART_TONES.length],
            )}
            style={{ width: `${Math.max(c.contribPercent, 2)}%` }}
          />
        </div>
      </div>
      <span className="text-fg-subtle shrink-0 text-[12px] tabular-nums">
        {c.commits} · {c.contribPercent}%
      </span>
    </div>
  )
}

/**
 * 워크스페이스 홈 GitHub 기여도 — 레포 탭 전환 + 레포별 기여자 목록(커밋·기여율 막대).
 * GitHub 미연동(DISCONNECTED) 프로젝트는 섹션 전체를 숨긴다.
 */
export function GithubContributionSection({
  projectId,
}: {
  projectId: string
}) {
  const { data } = useProjectGithub(projectId)
  const repos = data?.repositories ?? []
  const connected =
    data?.status === 'CONNECTED' || data?.status === 'PERMISSION_REQUIRED'
  const [activeId, setActiveId] = useState<number | null>(null)

  // 첫 레포를 기본 선택 — 레포 목록이 바뀌면 유효한 선택으로 보정.
  useEffect(() => {
    if (repos.length === 0) {
      setActiveId(null)
    } else if (!repos.some((r) => r.githubRepositoryId === activeId)) {
      setActiveId(repos[0].githubRepositoryId)
    }
  }, [repos, activeId])

  // 미연동이면 렌더 안 함(요구: 연동 안 된 프로젝트는 섹션 숨김).
  if (!connected || repos.length === 0) return null

  const active =
    repos.find((r) => r.githubRepositoryId === activeId) ?? repos[0]

  return (
    <section className={cn(card, 'flex flex-col gap-3')}>
      <div className="flex items-center gap-2">
        <GithubMark className="text-fg size-4" />
        <h2 className="text-fg text-[15px] font-bold">GitHub 기여도</h2>
      </div>

      {/* 레포 탭 */}
      <div className="flex flex-wrap gap-1.5">
        {repos.map((r) => {
          const on = r.githubRepositoryId === active.githubRepositoryId
          return (
            <button
              key={r.githubRepositoryId}
              type="button"
              onClick={() => setActiveId(r.githubRepositoryId)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
                on
                  ? 'bg-brand text-white'
                  : 'bg-surface-muted text-fg-muted hover:bg-surface-muted/70',
              )}
            >
              {r.name}
            </button>
          )
        })}
      </div>

      {/* 활성 레포 기여자 */}
      <div className="flex items-center justify-between">
        <span className="text-fg-subtle text-[12px]">
          분석 브랜치 {active.analysisBranch ?? '-'} · 총 커밋{' '}
          {active.totalCommits}
        </span>
      </div>
      {active.contributors.length === 0 ? (
        <p className="text-fg-subtle py-4 text-center text-[12px]">
          아직 집계된 기여가 없어요. 설정 탭에서 동기화하면 반영됩니다.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-[color:var(--color-divider)]">
          {active.contributors.map((c, i) => (
            <ContributorRow key={c.githubLogin} c={c} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
