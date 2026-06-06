import { cn } from '@/shared/lib/cn'
import type { ProjectStatus, ProjectSummary, Tone } from '../types'

// 프로젝트 목록 카드 — 좌측 색 바 + 상태 배지 + 메타 + 태그 + 핵심 성과 + 액션.
const ACCENT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const STATUS: Record<ProjectStatus, { cls: string; icon: string }> = {
  certified: { cls: 'bg-success-bg text-success', icon: '✓' },
  reviewing: { cls: 'bg-warning-bg text-warning', icon: '⏳' },
  draft: { cls: 'bg-accent-bg text-accent-strong', icon: '✎' },
}

export function ProjectCard({
  project,
  onOpen,
}: {
  project: ProjectSummary
  onOpen: (id: string) => void
}) {
  const st = STATUS[project.status]
  return (
    <section className="border-border bg-surface relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 pl-6">
      <span
        className={cn(
          'absolute top-0 left-0 h-full w-1',
          ACCENT[project.accentTone],
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="bg-surface-muted text-fg-muted rounded px-2 py-0.5 text-[11px] font-semibold">
              {project.kindLabel}
            </span>
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[11px] font-bold',
                st.cls,
              )}
            >
              {st.icon} {project.statusLabel}
            </span>
            {project.representative && (
              <span className="bg-brand/10 text-brand rounded px-2 py-0.5 text-[11px] font-bold">
                ★ 대표 후보
              </span>
            )}
          </div>
          <h3 className="text-fg text-[17px] font-bold">{project.title}</h3>
        </div>
        <button
          type="button"
          onClick={() => onOpen(project.id)}
          className={cn(
            'shrink-0 rounded-lg px-4 py-2.5 text-[12px] font-bold',
            project.status === 'reviewing'
              ? 'border-border text-fg-muted hover:bg-surface-muted border'
              : 'bg-brand text-white',
          )}
        >
          {project.actionLabel} →
        </button>
      </div>

      <div className="text-fg-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span>🏳 {project.pm}</span>
        <span>👤 {project.teamLabel}</span>
        <span>📅 {project.period}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <span
            key={t}
            className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-[11px] font-medium"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="bg-surface-muted/50 flex flex-col gap-1.5 rounded-[12px] p-4">
        <span className="text-success flex items-center gap-1.5 text-[12px] font-bold">
          ✓ 핵심 성과
        </span>
        {project.outcomes.map((o, i) => (
          <span key={i} className="text-fg-muted flex gap-1.5 text-[12px]">
            <span className="text-brand">•</span>
            {o}
          </span>
        ))}
      </div>
    </section>
  )
}
