import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ClipboardList, ExternalLink, Users } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { formatDate } from '@/shared/lib/date'
import {
  useCohortProjects,
  usePeerEvalToggle,
  useProjectCompletion,
} from './api'
import { useStudentAccounts } from '../api/students'
import { useCohortRoster } from '@/shared/api/students'
import { useInstructorCohortProjects } from '@/features/instructor/education/api'
import type { CohortProject } from './types'
import { PeerEvalResultsModal } from './PeerEvalResultsModal'

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
  onOpenResults,
}: {
  project: CohortProject
  courseId: string | null
  cohortId: string | null
  onOpenResults: (project: CohortProject) => void
}) {
  const toast = useToast()
  const toggle = usePeerEvalToggle(courseId, cohortId)
  const completion = useProjectCompletion(courseId, cohortId)
  const tooFewMembers = project.memberCount < 2
  // 동료 평가는 프로젝트가 끝난 뒤 하는 활동 — 진행 중에 열면 아직 하지 않은 협업을 평가하게 된다.
  // 서버도 같은 조건으로 막지만, 눌러보고 실패하는 대신 이유를 먼저 보여준다.
  const notCompleted = project.status !== 'COMPLETED'
  const on = project.peerEvalEnabled
  // 이미 켜진 것을 '중단'하는 건 언제나 가능해야 한다 — 잘못 연 경우를 되돌릴 수 있어야 하기 때문.
  const blocked = !on && (tooFewMembers || notCompleted)

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
        {/* 시작이 막힌 이유는 회색 보조문구로 두면 놓치기 쉽다 — 경고 톤으로 올려 버튼 비활성 이유를 드러낸다. */}
        <p
          className={cn(
            'text-xs',
            blocked ? 'text-warning font-medium' : 'text-fg-subtle',
          )}
        >
          {tooFewMembers && !on
            ? `팀원이 ${project.memberCount}명이라 시작할 수 없어요 — 2명 이상 필요합니다`
            : notCompleted && !on
              ? `아직 ${project.statusLabel}이라 시작할 수 없어요 — 기간이 끝났다면 [종료 처리]를 먼저 누르세요`
              : on
                ? '팀원이 서로 평가할 수 있어요'
                : '프로젝트가 끝났어요. 지금 시작할 수 있습니다'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {/* 진행 상황을 볼 수 없으면 여닫기만 가능하고 평가가 되고 있는지 알 수 없다. */}
        <button
          type="button"
          onClick={() => onOpenResults(project)}
          className="border-border text-fg-muted hover:bg-surface-muted bg-surface inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          현황 보기
        </button>
        {/* 기간이 끝났음을 여기서 표시한다 — 예전에는 강사 인증 승인 말고는 완료로 갈 길이 없어
            인증할 산출물이 아직 없으면 평가를 영영 열 수 없었다. */}
        <button
          type="button"
          onClick={() =>
            completion.mutate(
              { projectId: project.id, completed: notCompleted },
              {
                onSuccess: () =>
                  toast.success(
                    notCompleted
                      ? `프로젝트를 종료했어요 — ${project.title}`
                      : `프로젝트를 다시 진행 중으로 되돌렸어요 — ${project.title}`,
                  ),
                onError: () => toast.danger('프로젝트 상태를 바꾸지 못했어요.'),
              },
            )
          }
          disabled={completion.isPending}
          className="border-border text-fg-muted hover:bg-surface-muted bg-surface inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {completion.isPending
            ? '적용 중…'
            : notCompleted
              ? '종료 처리'
              : '진행 중으로'}
        </button>
        <button
          type="button"
          onClick={change}
          disabled={toggle.isPending || blocked}
          aria-pressed={on}
          title={
            tooFewMembers && !on
              ? `팀원이 ${project.memberCount}명입니다. 동료 평가는 서로 평가할 대상이 있어야 하므로 2명 이상일 때 시작할 수 있어요.`
              : notCompleted && !on
                ? '동료 평가는 프로젝트가 끝난 뒤에 진행합니다. 프로젝트 상태를 완료로 바꾸면 시작할 수 있어요.'
                : undefined
          }
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
    </div>
  )
}

// source: 매니저(admin, 기본)·강사(instructor) 공용 — 데이터만 역할별 미러로 갈리고 화면은
// 한 코드다(MaterialsPane 규약). 강사는 조회 전용 — 종료·동료평가 토글은 운영 액션이라 숨긴다.
export function ProjectsPane({
  courseId,
  cohortId,
  source = 'admin',
}: {
  /** 매니저(source='admin')만 필요 — 강사 미러는 서버가 기수에서 과정을 해석한다. */
  courseId?: string | null
  cohortId: string | null
  source?: 'admin' | 'instructor'
}) {
  const isAdmin = source === 'admin'
  const navigate = useNavigate()
  const adminQuery = useCohortProjects(
    isAdmin ? courseId : null,
    isAdmin ? cohortId : null,
  )
  const instructorQuery = useInstructorCohortProjects(isAdmin ? null : cohortId)
  const { data, isPending, isError, refetch } = isAdmin
    ? adminQuery
    : instructorQuery
  // 멤버 이름 — 매니저는 수강생 계정 목록, 강사는 계정 목록이 403이라 담당 기수 로스터(MaterialsPane 선례).
  const { data: students } = useStudentAccounts(isAdmin ? cohortId : null)
  const { data: roster } = useCohortRoster(isAdmin ? null : cohortId)
  const [resultsOf, setResultsOf] = useState<CohortProject | null>(null)

  const nameOf = useMemo(() => {
    const m = new Map<string, string>()
    if (isAdmin) for (const s of students?.items ?? []) m.set(s.id, s.name)
    else for (const r of roster ?? []) m.set(r.userId, r.name)
    return (id: string) => m.get(id) || '(이름 미확인)'
  }, [isAdmin, students, roster])

  // 상세(워크스페이스 읽기 전용) 진입 — 역할별 라우트.
  const workspacePath = (projectId: string) =>
    isAdmin
      ? `/admin/education/${cohortId}/projects/${projectId}`
      : `/instructor/cohorts/${cohortId}/projects/${projectId}`

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
                    {/* 워크스페이스 읽기 전용 열람 — 홈·보드·캘린더·회의록·문서·이슈·성과 7탭 */}
                    <button
                      type="button"
                      onClick={() => navigate(workspacePath(p.id))}
                      className="border-border text-fg-muted hover:bg-surface-muted bg-surface mt-3 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      워크스페이스 보기
                    </button>
                    {isAdmin && (
                      <PeerEvalToggle
                        project={p}
                        courseId={courseId ?? null}
                        cohortId={cohortId}
                        onOpenResults={setResultsOf}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      {resultsOf && (
        <PeerEvalResultsModal
          projectId={resultsOf.id}
          projectTitle={resultsOf.title}
          onClose={() => setResultsOf(null)}
        />
      )}
    </DataBoundary>
  )
}
