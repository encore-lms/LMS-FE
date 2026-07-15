import { useMemo } from 'react'
import { AlertTriangle, Users } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { formatDate } from '@/shared/lib/date'
import { useCohortProjects, usePeerEvalToggle } from './api'
import { useStudentAccounts } from '../api/students'
import type { CohortProject } from './types'

// 기수 프로젝트 목록(정본 §42·§43) — 운영 조회. 멤버 이름은 useStudentAccounts로 join.
const STATUS_META: Record<string, { label: string; cls: string }> = {
  PLANNED: { label: '예정', cls: 'bg-surface-muted text-fg-muted' },
  IN_PROGRESS: { label: '진행 중', cls: 'bg-accent-bg text-accent-strong' },
  COMPLETED: { label: '완료', cls: 'bg-success-bg text-success' },
}

/**
 * 동료 평가 개시 토글 — 프로젝트가 끝난 뒤 매니저·강사가 켜면 팀원이 서로 평가할 수 있다.
 * 팀원 2명 미만이면 서로 평가할 대상이 없어 서버가 거부하므로 미리 막고 이유를 알린다.
 */
function PeerEvalToggle({
  project,
  courseId,
  cohortId,
}: {
  project: CohortProject
  courseId: string | null
  cohortId: string | null
}) {
  const toast = useToast()
  const toggle = usePeerEvalToggle(courseId, cohortId)
  const tooFewMembers = project.memberCount < 2
  const on = project.peerEvalEnabled

  const change = () => {
    toggle.mutate(
      { projectId: project.id, enabled: !on },
      {
        onSuccess: () =>
          toast.success(
            !on
              ? `동료 평가를 시작했어요 — ${project.title}`
              : `동료 평가를 중단했어요 — ${project.title}`,
          ),
        onError: () =>
          toast.danger(
            '동료 평가 설정을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.',
          ),
      },
    )
  }

  return (
    <div className="border-border mt-3 flex items-center justify-between gap-2 border-t pt-3">
      <div className="min-w-0">
        <p className="text-fg text-[13px] font-semibold">동료 평가</p>
        <p className="text-fg-subtle text-xs">
          {tooFewMembers
            ? '팀원이 2명 이상이어야 시작할 수 있어요'
            : on
              ? '팀원이 서로 평가할 수 있어요'
              : '프로젝트가 끝나면 시작하세요'}
        </p>
      </div>
      <button
        type="button"
        onClick={change}
        disabled={toggle.isPending || tooFewMembers}
        aria-pressed={on}
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          on
            ? 'border-success/40 text-success bg-success-bg'
            : 'border-border text-fg-muted hover:bg-surface-muted bg-surface',
        )}
      >
        <Users className="h-3.5 w-3.5" />
        {toggle.isPending ? '적용 중…' : on ? '진행 중 · 중단' : '평가 시작'}
      </button>
    </div>
  )
}

export function ProjectsPane({
  courseId,
  cohortId,
}: {
  courseId: string | null
  cohortId: string | null
}) {
  const { data, isPending, isError, refetch } = useCohortProjects(
    courseId,
    cohortId,
  )
  const { data: students } = useStudentAccounts(cohortId)

  const nameOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of students?.items ?? []) m.set(s.id, s.name)
    return (id: string) => m.get(id) || '(이름 미확인)'
  }, [students])

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="불러오는 중…"
      errorTitle="프로젝트를 불러오지 못했어요"
      errorDescription={null}
    >
      {data &&
        (data.length === 0 ? (
          <Empty
            icon={<AlertTriangle />}
            title="이 기수에 등록된 프로젝트가 없어요"
            description="프로젝트가 생성되면 여기에서 확인할 수 있습니다."
          />
        ) : (
          <div className="space-y-3">
            <div className="text-fg-subtle text-sm">전체 {data.length}개</div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {data.map((p) => {
                const st = STATUS_META[p.status] ?? STATUS_META.PLANNED
                const owner = p.members.find((m) => m.role === 'OWNER')
                return (
                  <div
                    key={p.id}
                    className="border-border bg-surface rounded-xl border p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-fg font-bold">{p.title}</h3>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
                          st.cls,
                        )}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div className="text-fg-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span>
                        대표 {owner ? nameOf(owner.userId) : '미지정'}
                      </span>
                      <span className="text-fg-subtle">·</span>
                      <span>멤버 {p.memberCount}명</span>
                      {p.period && (
                        <>
                          <span className="text-fg-subtle">·</span>
                          <span>{p.period}</span>
                        </>
                      )}
                    </div>
                    {p.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-xs"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.members.map((m) => (
                        <span
                          key={m.userId}
                          className={cn(
                            'rounded-md px-2 py-0.5 text-xs',
                            m.role === 'OWNER'
                              ? 'bg-brand/10 text-brand font-semibold'
                              : 'bg-surface-muted text-fg-muted',
                          )}
                        >
                          {nameOf(m.userId)}
                          {m.role === 'OWNER' ? ' · 대표' : ''}
                        </span>
                      ))}
                    </div>
                    <div className="text-fg-subtle mt-2 text-xs">
                      생성 {formatDate(p.createdAt) || p.createdAt}
                    </div>
                    <PeerEvalToggle
                      project={p}
                      courseId={courseId}
                      cohortId={cohortId}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
    </DataBoundary>
  )
}
