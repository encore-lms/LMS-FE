import { Link } from 'react-router-dom'
import { FolderKanban, FolderPlus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { DashboardProject } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'
import { Chip } from './Chip'
import { EmptyState } from './EmptyState'
import { TONE_SOLID } from './tone'

// 진행 중 프로젝트 — 좌측 액센트 바 + 제목/역할·주차 + 진행률 바 + 상태 칩. 클릭 시 프로젝트로.
export function ProjectList({ projects }: { projects: DashboardProject[] }) {
  return (
    <SectionCard
      icon={FolderKanban}
      title="진행 중 프로젝트"
      subtitle="3건 진행 · 1건 인증 완료"
      action={<MoreLink to="/student/projects" label="프로젝트" />}
    >
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="진행 중인 프로젝트가 없어요"
          sub="새 프로젝트로 경험을 쌓아 보세요"
          ctaLabel="프로젝트 보러 가기"
          ctaTo="/student/projects"
        />
      ) : (
        <ul className="flex flex-col">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                to={p.to}
                className="hover:bg-surface-muted -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5"
              >
                <span
                  className={cn(
                    'h-10 w-1 shrink-0 rounded-full',
                    TONE_SOLID[p.accentTone],
                  )}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-fg truncate text-sm font-medium">
                    {p.title}
                  </span>
                  <span className="text-fg-subtle text-xs">{p.subtitle}</span>
                  <span className="bg-surface-muted block h-1.5 w-full overflow-hidden rounded-full">
                    <span
                      className={cn(
                        'block h-full rounded-full',
                        TONE_SOLID[p.accentTone],
                      )}
                      style={{ width: `${p.progressPct}%` }}
                    />
                  </span>
                </span>
                <Chip tone={p.status.tone}>{p.status.label}</Chip>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
