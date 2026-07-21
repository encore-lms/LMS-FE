import { cn } from '@/shared/lib/cn'
import { InteractiveCard } from '@/components/ui/InteractiveCard'
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

// 프로젝트 목록 행(구분선 리스트) — 상태 배지 + 제목 + 메타 + 태그 + 핵심 성과(조건부) + 액션.
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
    // 카드 인터랙션은 공용 InteractiveCard(이 카드가 정본 — QnA·트러블슈팅과 동일).
    <InteractiveCard
      onOpen={() => onOpen(project)}
      ariaLabel={`${project.title} 상세 보기`}
      className="group -mx-4 flex gap-4 rounded-xl px-4 py-5"
    >
      {/* 좌측 — 정보 계층: 배지 → 제목 → 메타 → 태그 → 핵심 성과(조건부) */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
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

        <h3 className="text-fg truncate text-[16px] font-bold">
          {project.title}
        </h3>

        <div className="text-fg-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
          <span className="inline-flex items-center gap-1">
            <Flag className="size-3.5" strokeWidth={2.2} />
            {project.pm}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" strokeWidth={2.2} />
            {project.teamLabel}
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Calendar className="size-3.5" strokeWidth={2.2} />
            {project.period}
          </span>
        </div>

        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {project.tags.map((t) => (
              <span
                key={t}
                className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-[11px] font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {project.outcomes.length > 0 && (
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-fg-subtle text-[11px] font-semibold">
              핵심 성과
            </span>
            {project.outcomes.slice(0, 3).map((o, i) => (
              <span key={i} className="text-fg-muted flex gap-1.5 text-[13px]">
                <CheckCircle2
                  className="text-success mt-[3px] size-3.5 shrink-0"
                  strokeWidth={2.3}
                />
                <span className="min-w-0">{o}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 우측 — 액션 */}
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
              'flex size-9 items-center justify-center rounded-lg transition-colors',
              project.representative
                ? 'text-brand'
                : 'text-fg-subtle hover:bg-surface hover:text-brand',
            )}
          >
            <Star
              className={cn('size-4', project.representative && 'fill-current')}
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
            className="text-fg-subtle hover:bg-danger-bg hover:text-danger flex size-9 items-center justify-center rounded-lg transition-colors"
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
            'rounded-lg px-4 py-2.5 text-[12px] font-bold transition-colors',
            phase === 'reviewing'
              ? 'text-fg-muted hover:bg-surface'
              : 'bg-brand hover:bg-brand-deep text-white',
          )}
        >
          {project.actionLabel}
          <ArrowRight className="ml-1 inline size-3.5" strokeWidth={2.4} />
        </button>
      </div>
    </InteractiveCard>
  )
}
