import { Link } from 'react-router-dom'
import type { DashboardProject } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'

// 진행 중 프로젝트 — 제목 + 인증 배지 + 팀원 수. 클릭 시 프로젝트로.
export function ProjectList({ projects }: { projects: DashboardProject[] }) {
  return (
    <SectionCard
      title="진행 중 프로젝트"
      action={<MoreLink to="/student/projects" />}
    >
      {projects.length === 0 ? (
        <p className="text-fg-subtle py-4 text-center text-sm">
          진행 중인 프로젝트가 없어요
        </p>
      ) : (
        <ul className="flex flex-col">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                to={p.to}
                className="hover:bg-surface-muted -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-fg truncate text-sm">{p.title}</span>
                  {p.certified && (
                    <span className="bg-success-bg text-success shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold">
                      인증
                    </span>
                  )}
                </span>
                <span className="text-fg-subtle shrink-0 text-xs">
                  {p.members}명
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
