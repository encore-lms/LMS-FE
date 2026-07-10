import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useDeleteProject, useProjectList } from '../api/projects'
import { ProjectStatCards } from './components/ProjectStatCards'
import { ProjectCard } from './components/ProjectCard'
import { MAX_REPRESENTATIVES, useRepresentatives } from './representatives'
import { SkeletonCards } from '@/components/ui/Skeleton'
import type {
  ProjectFilter,
  ProjectKind,
  ProjectStat,
  ProjectSummary,
} from './types'
import {
  statusToPhase,
  useProjectFlow,
  type ProjectPhase,
} from './workspace/useProjectFlow'

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
      (data?.projects ?? []).map((p) => ({
        ...p,
        representative: repIds.includes(p.id),
        phase: phases[p.id] ?? statusToPhase(p.status),
      })),
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

  // 통계·필터를 현재 단계 기준으로 재구성 — 목록 배지와 항상 일치.
  const stats: ProjectStat[] = [
    {
      key: 'draft',
      label: '작성 중',
      value: String(byPhase('active')),
      unit: '건',
      sub: '진행 중',
      tone: 'accent',
    },
    {
      key: 'completed',
      label: '작성 완료',
      value: String(byPhase('completed')),
      unit: '건',
      sub: '상호평가·인증 요청',
      tone: 'info',
    },
    {
      key: 'reviewing',
      label: '검토 중',
      value: String(byPhase('reviewing')),
      unit: '건',
      sub: '강사 검토 대기',
      tone: 'warning',
    },
    {
      key: 'certified',
      label: '인증 완료',
      value: String(byPhase('certified')),
      unit: '건',
      sub: '대표 후보 가능',
      tone: 'success',
    },
  ]
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

  if (isPending) return <SkeletonCards count={6} className="p-8" />
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="프로젝트를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <ProjectStatCards stats={stats} />

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-[16px] font-bold">참여 프로젝트</h2>
          <span className="text-fg-subtle text-[12px]">
            {filteredProjects.length}건
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="border-border text-fg-subtle focus-within:border-brand hidden h-9 items-center gap-2 rounded-lg border bg-white px-3 text-[12px] sm:inline-flex">
            <Search className="size-3.5 shrink-0" strokeWidth={2} />
            <input
              aria-label="프로젝트명·스택 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="프로젝트명·스택 검색"
              className="placeholder:text-fg-subtle text-fg w-44 bg-transparent outline-none"
            />
          </label>
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
      <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3">
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

      <div className="flex flex-col gap-4">
        {pageProjects.length > 0 ? (
          pageProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              phase={p.phase}
              onOpen={open}
              onDelete={setPendingDelete}
              onToggleRep={onToggleRep}
            />
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
              className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
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
              className="bg-danger rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
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
  )
}
