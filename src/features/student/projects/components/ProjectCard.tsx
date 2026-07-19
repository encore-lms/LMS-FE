import { cn } from '@/shared/lib/cn'
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Flag,
  Pencil,
  Star,
  Timer,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ProjectSummary } from '../types'
import type { ProjectPhase } from '../workspace/useProjectFlow'
import { TONE_SOLID } from '@/shared/lib/tone'

// 프로젝트 목록 카드 — 좌측 색 바 + 상태 배지 + 메타 + 태그 + 핵심 성과 + 액션.
// 생애주기 단계별 상태 배지 — 작성 중 → 작성 완료 → 검토 중 → 인증 완료.
const PHASE: Record<
  ProjectPhase,
  { label: string; cls: string; Icon: LucideIcon }
> = {
  active: {
    label: '작성 중',
    cls: 'bg-accent-bg text-accent-strong',
    Icon: Pencil,
  },
  completed: { label: '작성 완료', cls: 'bg-info-bg text-info', Icon: Check },
  reviewing: {
    label: '검토 중',
    cls: 'bg-warning-bg text-warning',
    Icon: Timer,
  },
  certified: {
    label: '인증 완료',
    cls: 'bg-success-bg text-success',
    Icon: CheckCircle2,
  },
}

export function ProjectCard({
  project,
  phase,
  onOpen,
  onDelete,
  onToggleRep,
}: {
  project: ProjectSummary
  phase: ProjectPhase
  onOpen: (project: ProjectSummary) => void
  onDelete?: (project: ProjectSummary) => void
  /** 대표 후보 토글 — 인증 완료 프로젝트에서만 별(★)로 노출. */
  onToggleRep?: (project: ProjectSummary) => void
}) {
  const st = PHASE[phase]
  const StatusIcon = st.Icon
  // 인증 완료 프로젝트만 대표 후보로 지정할 수 있다.
  const canToggleRep = phase === 'certified' && !!onToggleRep

  return (
    <section
      role="button"
      tabIndex={0}
      aria-label={`${project.title} 상세 보기`}
      onClick={() => onOpen(project)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(project)
        }
      }}
      className="bg-surface focus-visible:ring-brand/40 hover:bg-surface-muted relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl p-5 pl-6 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span
        className={cn(
          'absolute top-0 left-0 h-full w-1',
          TONE_SOLID[project.accentTone],
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
                'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold',
                st.cls,
              )}
            >
              <StatusIcon className="size-3" strokeWidth={2.3} />
              {st.label}
            </span>
            {project.representative && (
              <span className="bg-brand/10 text-brand inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold">
                <Star className="size-3 fill-current" strokeWidth={2.3} />
                대표 후보
              </span>
            )}
          </div>
          <h3 className="text-fg text-[17px] font-bold">{project.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canToggleRep && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleRep(project)
              }}
              aria-pressed={project.representative}
              aria-label={
                project.representative
                  ? `${project.title} 대표 후보 해제`
                  : `${project.title} 대표 후보 지정`
              }
              title={
                project.representative ? '대표 후보 해제' : '대표 후보로 지정'
              }
              className={cn(
                'flex size-10 items-center justify-center rounded-lg border transition-colors',
                project.representative
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border text-fg-subtle hover:border-brand/50 hover:text-brand',
              )}
            >
              <Star
                className={cn(
                  'size-4',
                  project.representative && 'fill-current',
                )}
                strokeWidth={2}
              />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(project)
              }}
              aria-label={`${project.title} 삭제`}
              className="border-border text-fg-subtle hover:border-danger hover:text-danger flex size-10 items-center justify-center rounded-lg border transition-colors"
            >
              <Trash2 className="size-4" strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpen(project)
            }}
            className={cn(
              'rounded-lg px-4 py-2.5 text-[12px] font-bold',
              phase === 'reviewing'
                ? 'border-border text-fg-muted hover:bg-surface-muted border'
                : 'bg-brand text-white',
            )}
          >
            {project.actionLabel}
            <ArrowRight className="ml-1 inline size-3.5" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="text-fg-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span className="inline-flex items-center gap-1">
          <Flag className="size-3.5" strokeWidth={2.2} />
          {project.pm}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" strokeWidth={2.2} />
          {project.teamLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-3.5" strokeWidth={2.2} />
          {project.period}
        </span>
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
          <CheckCircle2 className="size-3.5" strokeWidth={2.3} />
          핵심 성과
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
