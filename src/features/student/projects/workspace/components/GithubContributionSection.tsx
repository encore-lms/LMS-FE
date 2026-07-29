import { useEffect, useState } from 'react'
import { GitBranch } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useProjectGithub } from '../../../api/projectGithub'
import type { ProjectGithubContributor } from '../../githubTypes'
import { GithubHeatmap } from './GithubHeatmap'
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

// 기여자 막대·아바타 색 — 순위별 팔레트(1위 brand, 이후 순환).
const RANK_TONE = [
  { bar: 'bg-brand', ring: 'ring-brand/30', text: 'text-brand' },
  { bar: 'bg-info', ring: 'ring-info/30', text: 'text-info' },
  {
    bar: 'bg-accent-strong',
    ring: 'ring-accent-strong/30',
    text: 'text-accent-strong',
  },
  { bar: 'bg-warning', ring: 'ring-warning/30', text: 'text-warning' },
  { bar: 'bg-success', ring: 'ring-success/30', text: 'text-success' },
  { bar: 'bg-danger', ring: 'ring-danger/30', text: 'text-danger' },
]

function ContributorRow({
  c,
  index,
}: {
  c: ProjectGithubContributor
  index: number
}) {
  const tone = RANK_TONE[index % RANK_TONE.length]
  const initial = (c.name || c.githubLogin || '?').slice(0, 1).toUpperCase()
  return (
    <div className="hover:bg-surface-muted/40 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors">
      {/* 순위 */}
      <span className="text-fg-subtle w-4 shrink-0 text-center text-[12px] font-bold tabular-nums">
        {index + 1}
      </span>
      {/* 아바타 (톤 ring) */}
      {c.avatarUrl ? (
        <img
          src={c.avatarUrl}
          alt=""
          className={cn(
            'size-9 shrink-0 rounded-full object-cover ring-2',
            tone.ring,
          )}
        />
      ) : (
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ring-2',
            tone.bar,
            tone.ring,
          )}
        >
          {initial}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-fg truncate text-[13px] font-bold">
            {c.name}
          </span>
          {c.isLmsUser ? (
            <span className="bg-brand/10 text-brand rounded-md px-1.5 py-0.5 text-[10px] font-bold">
              LMS
            </span>
          ) : (
            <span className="text-fg-subtle truncate text-[11px]">
              @{c.githubLogin}
            </span>
          )}
        </div>
        <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-500',
              tone.bar,
            )}
            style={{ width: `${Math.max(c.contribPercent, 2)}%` }}
          />
        </div>
      </div>
      {/* 커밋·기여율 — 커밋 강조 + 기여율 부제 */}
      <div className="flex shrink-0 flex-col items-end leading-tight">
        <span className="text-fg text-[14px] font-bold tabular-nums">
          {c.commits.toLocaleString()}
        </span>
        <span
          className={cn('text-[11px] font-semibold tabular-nums', tone.text)}
        >
          {c.contribPercent}%
        </span>
      </div>
    </div>
  )
}

/**
 * 워크스페이스 홈 GitHub 기여도 — 레포 탭 전환 + 잔디 히트맵 + 기여자 순위(커밋·기여율).
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
    <section className={cn(card, 'flex flex-col gap-4')}>
      {/* 헤더 — 제목 + 조직 요약 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GithubMark className="text-fg size-[18px]" />
          <h2 className="text-fg text-[15px] font-bold">GitHub 기여도</h2>
        </div>
        {data?.organization?.login && (
          <span className="text-fg-subtle truncate text-[12px]">
            @{data.organization.login} · {repos.length}개 저장소
          </span>
        )}
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
                  ? 'bg-brand text-white shadow-[0px_2px_8px_0px_rgba(41,181,176,0.25)]'
                  : 'bg-surface-muted text-fg-muted hover:bg-surface-muted/70',
              )}
            >
              {r.name}
            </button>
          )
        })}
      </div>

      {/* 본문 — 좌: 잔디 / 우: 기여자 (좁으면 세로로) */}
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
        {/* 좌: 활성 레포 요약 + 잔디 */}
        <div className="flex shrink-0 flex-col gap-3">
          <div className="flex items-center gap-1.5 text-[12px]">
            <GitBranch className="text-fg-subtle size-3.5" aria-hidden="true" />
            <span className="text-fg font-semibold">
              {active.analysisBranch ?? '-'}
            </span>
            <span className="text-fg-subtle">
              · 총 {active.totalCommits.toLocaleString()} 커밋
            </span>
          </div>
          <GithubHeatmap daily={active.dailyActivity} />
        </div>

        {/* 우: 기여자 순위 */}
        <div className="border-divider flex min-w-0 flex-1 flex-col gap-1 lg:border-l lg:pl-6">
          <span className="text-fg-subtle pb-1 text-[11px] font-semibold">
            기여자 {active.contributors.length}명
          </span>
          {active.contributors.length === 0 ? (
            <p className="text-fg-subtle py-5 text-center text-[12px]">
              아직 집계된 기여가 없어요. 설정 탭에서 동기화하면 반영됩니다.
            </p>
          ) : (
            active.contributors.map((c, i) => (
              <ContributorRow key={c.githubLogin} c={c} index={i} />
            ))
          )}
        </div>
      </div>
    </section>
  )
}
