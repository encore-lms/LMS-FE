import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useDeleteProject, useProjectList } from '../api/projects'
import { InvitationCard } from './components/InvitationCard'
import { ProjectCard } from './components/ProjectCard'
import { MAX_REPRESENTATIVES, useRepresentatives } from './representatives'
import { SkeletonCards } from '@/components/ui/Skeleton'
import type { ProjectFilter, ProjectKind, ProjectSummary } from './types'
import {
  statusToPhase,
  useProjectFlow,
  type ProjectPhase,
} from './workspace/useProjectFlow'
import { SearchInput } from '@/components/ui/SearchInput'
import { CourseTabs } from '../course/CourseTabs'

// 생애주기 단계 → 상태 필터 키(작성 중=active는 draft 키 재사용).
const phaseFilterKey = (phase: ProjectPhase): string =>
  phase === 'active' ? 'draft' : phase

// period 문자열 앞의 시작일(YYYY-MM-DD) — 최신순 정렬 키. 없으면 빈 문자열(맨 뒤).
const startDateKey = (p: ProjectSummary): string =>
  p.period.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? ''

// 프로젝트 목록 (/student/projects) — Figma 337:930.
const PAGE_SIZE = 3

export default function ProjectListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useProjectList()
  const deleteProject = useDeleteProject()
  const [activeStatus, setActiveStatus] = useState('all')
  const [activeKind, setActiveKind] = useState<'all' | ProjectKind>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<ProjectSummary | null>(
    null,
  )
  usePageHeader(data?.headerTitle ?? '프로젝트', data?.headerSub)

  const phases = useProjectFlow((s) => s.phases)
  const repIds = useRepresentatives((s) => s.ids)
  const toggleRep = useRepresentatives((s) => s.toggle)
  // 각 프로젝트의 현재 단계·대표 후보 여부 — 단계는 진행 단계 우선, 대표 후보는 스토어 기준.
  const projects = useMemo(
    () =>
      (data?.projects ?? []).map((p) => {
        // 워크스페이스에서 단계를 진행시켰다면 그 단계가 최신이다 — 그때는 서버 이름을 쓰지
        // 않는다(방금 '작성 완료'로 넘겼는데 카드가 '작성 중'이라고 우기게 된다).
        const moved = phases[p.id]
        return {
          ...p,
          representative: repIds.includes(p.id),
          phase: moved ?? statusToPhase(p.status),
          labelOverride: moved ? undefined : p.statusLabel,
        }
      }),
    [data, phases, repIds],
  )

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return projects.filter((project) => {
      const matchesStatus =
        activeStatus === 'all' ||
        phaseFilterKey(project.phase) === activeStatus ||
        (activeStatus === 'representative' && project.representative)
      const matchesKind = activeKind === 'all' || project.kind === activeKind
      const matchesQuery =
        !normalized ||
        [
          project.title,
          project.kindLabel,
          project.pm,
          project.teamLabel,
          project.period,
          ...project.tags,
          ...project.outcomes,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalized)

      return matchesStatus && matchesKind && matchesQuery
    })
  }, [activeKind, activeStatus, projects, query])

  // 대표 후보를 항상 최상단에, 그 외에는 최신순(시작일 내림차순)으로 정렬.
  const sortedProjects = useMemo(
    () =>
      [...filteredProjects].sort((a, b) => {
        const rep = Number(b.representative) - Number(a.representative)
        if (rep !== 0) return rep
        return startDateKey(b).localeCompare(startDateKey(a))
      }),
    [filteredProjects],
  )

  useEffect(() => {
    setPage(1)
  }, [activeKind, activeStatus, query])

  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / PAGE_SIZE))
  const pageProjects = sortedProjects.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )
  const teamCount = projects.filter((p) => p.kind === 'team').length
  const personalCount = projects.filter((p) => p.kind === 'personal').length
  const byPhase = (ph: ProjectPhase) =>
    projects.filter((p) => p.phase === ph).length

  // 필터를 현재 단계 기준으로 재구성 — 목록 배지와 항상 일치.
  const filters: ProjectFilter[] = [
    { key: 'all', label: '전체', count: projects.length },
    { key: 'certified', label: '인증 완료', count: byPhase('certified') },
    { key: 'reviewing', label: '검토 중', count: byPhase('reviewing') },
    { key: 'completed', label: '작성 완료', count: byPhase('completed') },
    { key: 'draft', label: '작성 중', count: byPhase('active') },
    {
      key: 'representative',
      label: '대표 후보',
      count: projects.filter((p) => p.representative).length,
    },
  ]

  const open = (project: ProjectSummary) => {
    const phase = phases[project.id] ?? statusToPhase(project.status)
    const suffix = phase === 'reviewing' ? '?tab=certification' : ''
    navigate(`/student/projects/${project.id}${suffix}`)
  }

  // 대표 후보 토글 — 인증 완료만 지정 가능(카드에서 별만 노출), 최대 3개.
  const onToggleRep = (project: ProjectSummary) => {
    const result = toggleRep(project.id)
    if (result === 'added')
      toast.success(`‘${project.title}’ 대표 후보로 지정했어요`)
    else if (result === 'removed')
      toast.info(`‘${project.title}’ 대표 후보에서 해제했어요`)
    else
      toast.danger(
        `대표 후보는 최대 ${MAX_REPRESENTATIVES}개까지 지정할 수 있어요`,
      )
  }

  const shownLabel = `${filteredProjects.length}건 표시 · 작성 중 ${byPhase('active')} / 작성 완료 ${byPhase('completed')} / 검토 중 ${byPhase('reviewing')} / 인증 완료 ${byPhase('certified')}`

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      skeleton={<SkeletonCards count={6} />}
      errorTitle="프로젝트를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      <div className="flex flex-col gap-5 p-8">
        <CourseTabs />
        {/* 받은 초대 — 아직 팀이 아니라 아래 목록에는 없다. 답해야 목록으로 넘어온다. */}
        <InvitationCard />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <h2 className="text-fg text-[16px] font-bold">참여 프로젝트</h2>
            <span className="text-fg-subtle text-[12px]">
              {filteredProjects.length}건
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="프로젝트명·스택 검색"
              ariaLabel="프로젝트명·스택 검색"
              className="hidden w-56 sm:flex"
            />
            <button
              type="button"
              onClick={() => navigate('/student/projects/new')}
              className={buttonClass({ size: 'sm' })}
            >
              신규 프로젝트
              <ArrowRight className="size-3.5" strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* 필터 칩 */}
        <div className="bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => {
              const on = f.key === activeStatus
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveStatus(f.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                    on
                      ? 'bg-brand-deep text-white'
                      : 'border-border text-fg-muted hover:bg-surface-muted border',
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      'rounded-md px-1.5 text-[12px]',
                      on
                        ? 'bg-white/15 text-white'
                        : 'bg-surface-muted text-fg-subtle',
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'team' as const, label: '팀', count: teamCount },
              { key: 'personal' as const, label: '개인', count: personalCount },
            ].map((f) => {
              const on = activeKind === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveKind(on ? 'all' : f.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                    on
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border text-fg-muted hover:bg-surface-muted',
                  )}
                >
                  {f.label}
                  <span className="bg-surface-muted text-fg-subtle rounded-md px-1.5">
                    {f.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col">
          {pageProjects.length > 0 ? (
            pageProjects.map((p, i) => (
              <Fragment key={p.id}>
                {i > 0 && <div className="bg-divider h-px w-full" />}
                <ProjectCard
                  project={p}
                  phase={p.phase}
                  statusLabel={p.labelOverride}
                  onOpen={open}
                  onDelete={setPendingDelete}
                  onToggleRep={onToggleRep}
                />
              </Fragment>
            ))
          ) : (
            <Empty
              title="조건에 맞는 프로젝트가 없어요"
              description="검색어와 필터를 다시 조정해 주세요."
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-fg-subtle text-[12px]">{shownLabel}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px] disabled:opacity-40"
              aria-label="이전 페이지"
            >
              <ChevronLeft className="size-4" strokeWidth={2.2} />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNo) => (
                <button
                  key={pageNo}
                  type="button"
                  onClick={() => setPage(pageNo)}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg text-[13px] font-semibold',
                    pageNo === page
                      ? 'bg-brand-deep text-white'
                      : 'border-border text-fg-subtle border',
                  )}
                >
                  {pageNo}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px] disabled:opacity-40"
              aria-label="다음 페이지"
            >
              <ChevronRight className="size-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <Modal
          open={pendingDelete !== null}
          onClose={() => setPendingDelete(null)}
          title="프로젝트 삭제"
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!pendingDelete) return
                  const target = pendingDelete
                  deleteProject.mutate(target.id, {
                    onSuccess: () => {
                      toast.success(`‘${target.title}’ 프로젝트를 삭제했습니다`)
                      setPendingDelete(null)
                    },
                    onError: () => toast.danger('프로젝트 삭제에 실패했습니다'),
                  })
                }}
                disabled={deleteProject.isPending}
                className={buttonClass({ variant: 'danger', size: 'md' })}
              >
                삭제
              </button>
            </>
          }
        >
          <p className="text-fg-muted text-[13px] leading-6">
            <b className="text-fg">{pendingDelete?.title}</b> 프로젝트를
            삭제할까요? 이 작업은 되돌릴 수 없으며, 연결된 워크스페이스 정보도
            함께 제거됩니다.
          </p>
        </Modal>
      </div>
    </DataBoundary>
  )
}
