import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { cn } from '@/shared/lib/cn'
import { formatDate } from '@/shared/lib/date'
import { useCohortProjects } from './api'
import { useStudentAccounts } from '../api/students'

// 기수 프로젝트 목록(정본 §42·§43) — 운영 조회. 멤버 이름은 useStudentAccounts로 join.
const STATUS_META: Record<string, { label: string; cls: string }> = {
  PLANNED: { label: '예정', cls: 'bg-surface-muted text-fg-muted' },
  IN_PROGRESS: { label: '진행 중', cls: 'bg-accent-bg text-accent-strong' },
  COMPLETED: { label: '완료', cls: 'bg-success-bg text-success' },
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
                  </div>
                )
              })}
            </div>
          </div>
        ))}
    </DataBoundary>
  )
}
