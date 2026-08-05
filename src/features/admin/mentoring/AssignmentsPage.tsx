import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FileText, Plus, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
import { useCourseConfig, useCourseList } from '../api/settings'
import { useMyCohorts } from '../api/dashboard'
import { useAdminMentoringLogs, useMentorAssignments } from './api'
import {
  ASSIGNMENT_STATUS_META,
  nHoursDoneLabel,
  assignmentDisplayStatus,
  progressFillClass,
} from './statusMeta'
import { AssignmentFormModal } from './AssignmentFormModal'
import { AssignmentCreateModal } from './AssignmentCreateModal'
import type { MentorAssignmentRow } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { ListToolbar } from '@/components/ui/ListToolbar'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'

/** 멘토링 카드 — 멘토·멘티·진행/잔여 시간·일지(총·미인증). 기수 그룹 안에 팀 단위로 노출. */
function MentoringCard({
  team,
  logStat,
  logsPending,
  onAssign,
}: {
  team: MentorAssignmentRow
  logStat?: { total: number; uncertified: number }
  logsPending: boolean
  onAssign: () => void
}) {
  const navigate = useNavigate()
  const displayStatus = assignmentDisplayStatus(team)
  const meta = ASSIGNMENT_STATUS_META[displayStatus]
  // 'N시간 완료'는 실제 배정 시간으로 표기(2026-08-04 QA).
  const statusLabel =
    displayStatus === 'n_hours_done'
      ? nHoursDoneLabel(team.allocatedHours)
      : meta.label
  const progress = team.recognizedHours ?? 0
  const remaining =
    team.allocatedHours !== null
      ? Math.max(0, team.allocatedHours - progress)
      : null
  const pct = team.recognizedPct
  const total = logStat?.total ?? 0
  const uncertified = logStat?.uncertified ?? 0
  const openDetail = () => navigate(`/admin/mentoring/teams/${team.teamId}`)
  // 멘티 명단 — 이름 칩으로 표시(최대 6명, 초과분은 +N). BE 미배포 시 빈 배열.
  const members = team.members ?? []
  const shownMembers = members.slice(0, 6)
  const memberOverflow = members.length - shownMembers.length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openDetail()
        }
      }}
      className={cn(
        'bg-surface flex cursor-pointer flex-col gap-3 rounded-2xl p-4 shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)] transition-shadow outline-none hover:shadow-[0_6px_16px_rgba(18,23,38,0.10)] focus-visible:shadow-[0_0_0_2px_var(--color-brand)]',
        !team.assignmentId &&
          'bg-danger-bg/30 shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(240,69,69,0.3)]',
      )}
    >
      {/* 헤더 — 팀명 + 상태 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-fg truncate text-[14px] font-bold">
            {team.teamName}
          </p>
          <p className="text-fg-subtle text-[11px]">
            멘티 {team.memberCount}명
          </p>
        </div>
        <StatusBadge label={statusLabel} tone={meta.tone} />
      </div>

      {/* 멘토 */}
      <div className="border-divider flex items-center gap-2 border-t pt-3">
        {team.mentor ? (
          <>
            <Avatar name={team.mentor.name} size={30} />
            <div className="min-w-0">
              <p className="text-fg-subtle text-[10.5px]">멘토</p>
              <p className="text-fg truncate text-[13px] font-bold">
                {team.mentor.name}
              </p>
            </div>
          </>
        ) : (
          <>
            <span className="bg-fg-subtle text-on-color inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-xs font-bold">
              ?
            </span>
            <span className="text-fg-subtle text-[13px] font-medium">
              멘토 미배정
            </span>
          </>
        )}
      </div>

      {/* 멘티 명단 — 이름 칩(작은 아바타 + 이름). */}
      {shownMembers.length > 0 && (
        <div className="border-divider flex flex-wrap items-center gap-1.5 border-t pt-3">
          {shownMembers.map((m) => (
            <span
              key={m.userId}
              className="bg-surface-muted flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5"
            >
              <Avatar name={m.name} size={20} />
              <span className="text-fg text-[11.5px] font-medium">
                {m.name}
              </span>
            </span>
          ))}
          {memberOverflow > 0 && (
            <span className="text-fg-subtle bg-surface-muted flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold">
              +{memberOverflow}
            </span>
          )}
        </div>
      )}

      {/* 진행/잔여 시간 + 진행바 */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-fg-muted">
            진행{' '}
            <b className="text-fg tabular-nums">
              {team.recognizedHours !== null ? `${progress}h` : '-'}
            </b>
            {remaining !== null && (
              <>
                {' · '}잔여 <b className="text-fg tabular-nums">{remaining}h</b>
              </>
            )}
          </span>
          {team.allocatedHours !== null && (
            <span className="text-fg-subtle tabular-nums">
              배정 {team.allocatedHours}h{pct !== null && ` · ${pct}%`}
              {team.contractEndDate && ` · 계약 ~${team.contractEndDate}`}
            </span>
          )}
        </div>
        {pct !== null && (
          <div className="bg-surface-muted h-[5px] w-full overflow-hidden rounded-full">
            <div
              className={cn('h-full rounded-full', progressFillClass(pct))}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* 일지 — 총 / 미인증 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-muted/50 rounded-lg px-3 py-2">
          <p className="text-fg-subtle text-[10.5px]">총 일지</p>
          <p className="text-fg text-[15px] font-bold tabular-nums">
            {logsPending ? '…' : `${total}건`}
          </p>
        </div>
        <div
          className={cn(
            'rounded-lg px-3 py-2',
            uncertified > 0 ? 'bg-warning-bg' : 'bg-surface-muted/50',
          )}
        >
          <p className="text-fg-subtle text-[10.5px]">미인증 일지</p>
          <p
            className={cn(
              'text-[15px] font-bold tabular-nums',
              uncertified > 0 ? 'text-warning' : 'text-fg',
            )}
          >
            {logsPending ? '…' : `${uncertified}건`}
          </p>
        </div>
      </div>

      {/* 액션 — 미배정 팀의 멘토 배정만. 조기 종료·수정·일지 항목은 상세 페이지에서. */}
      {!team.assignmentId && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="border-divider flex flex-wrap items-center gap-1.5 border-t pt-3"
        >
          <button
            type="button"
            onClick={onAssign}
            className="bg-danger text-on-color hover:bg-danger/90 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-bold"
          >
            <UserPlus className="h-3 w-3" />
            멘토 배정
          </button>
        </div>
      )}
    </div>
  )
}

// 멘토 배정 관리 (/admin/mentors/assignments) — 운영(MANAGER/ADMIN).
// 반/기수별 팀 배정 · N시간 · 일지 템플릿 관리. (Figma "운영 — 멘토 배정 관리" 2744:7725)
// embedded=true 면 기수 허브의 '멘토링' 탭에 임베드 — 자체 헤더·바깥 패딩과
// 과정·기수 셀렉터를 생략하고, 상위가 정한 기수({@code scopeCohortId})로 조회한다.
export default function AssignmentsPage({
  embedded = false,
  scopeCohortId,
  scopeCourseId,
}: {
  embedded?: boolean
  scopeCohortId?: string
  scopeCourseId?: string
} = {}) {
  usePageHeader('멘토 배정 관리', undefined, !embedded)
  // 과정·기수는 한 번의 setSearchParams로 갱신한다 — setCourse/setCohort를 연속 호출하면
  // 두 갱신이 각자 현재 URL을 기준으로 덮어써 뒤 호출이 앞 호출을 지운다(과정이 초기화되는 버그).
  const [searchParams, setSearchParams] = useSearchParams()
  const course = scopeCourseId ?? searchParams.get('course') ?? 'all' // 'all' | courseId
  const cohort = scopeCohortId ?? searchParams.get('cohort') ?? 'all' // 'all' | cohortId
  // 보드는 상단 선택 기수 기준으로 조회(선택 없으면 담당/폴백 기수).
  const { data, isPending, isError, refetch } = useMentorAssignments(cohort)
  const logs = useAdminMentoringLogs()
  // 상단 과정·기수 셀렉터 — 과정·기수·교과목 페이지와 동일하게 교육 과정 카탈로그(learning-service)에서 가져온다.
  const courseList = useCourseList()
  const pickCourse = (next: string) =>
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === 'all') p.delete('course')
        else p.set('course', next)
        p.delete('cohort') // 과정 변경 시 기수 초기화(같은 갱신 안에서)
        return p
      },
      { replace: true },
    )
  const pickCohort = (next: string) =>
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === 'all') p.delete('cohort')
        else p.set('cohort', next)
        return p
      },
      { replace: true },
    )
  const courseConfig = useCourseConfig(course === 'all' ? null : course)
  const selectedCourseTitle =
    course === 'all'
      ? null
      : (courseList.data?.find((c) => c.courseId === course)?.title ?? null)

  // 최초 진입 시 URL에 선택이 없으면 멘토링 보드가 실제로 조회한 기수를 기본 선택한다.
  const myCohorts = useMyCohorts()
  const didDefaultCohort = useRef(false)
  useEffect(() => {
    if (didDefaultCohort.current) return
    // 임베드는 기수가 이미 정해져 들어온다 — URL 을 건드리면 바깥 탭 상태와 부딪친다.
    if (scopeCohortId) {
      didDefaultCohort.current = true
      return
    }
    if (searchParams.get('course')) {
      didDefaultCohort.current = true // 딥링크/직접 선택은 존중
      return
    }
    const defaultCohortId = data?.cohorts[0]?.cohortId
    const first =
      myCohorts.data?.find((ref) => ref.cohortId === defaultCohortId) ??
      myCohorts.data?.[0]
    if (!first || !defaultCohortId) return
    didDefaultCohort.current = true
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        p.set('course', first.courseId)
        p.set('cohort', defaultCohortId)
        return p
      },
      { replace: true },
    )
  }, [
    data?.cohorts,
    myCohorts.data,
    searchParams,
    setSearchParams,
    scopeCohortId,
  ])
  const [mentorFilter, setMentorFilter] = useSearchParamState('mentor', 'all')
  const [q, setQ] = useSearchParamState('q')
  const [formTeamId, setFormTeamId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const toast = useToast()

  const rows = useMemo(() => data?.rows ?? [], [data])
  // 팀별 일지 집계 — 총 개수 / 미인증(유효 아님: 초안·수정요청) 개수.
  const logStats = useMemo(() => {
    const map = new Map<string, { total: number; uncertified: number }>()
    for (const r of logs.data?.rows ?? []) {
      const s = map.get(r.teamId) ?? { total: 0, uncertified: 0 }
      s.total += 1
      if (r.status !== 'valid') s.uncertified += 1
      map.set(r.teamId, s)
    }
    return map
  }, [logs.data])
  // 보드는 이미 상단 선택 기수로 조회되므로, 클라이언트에선 멘토·검색만 거른다.
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (mentorFilter !== 'all' && r.mentor?.mentorId !== mentorFilter)
        return false
      if (needle) {
        const hay = `${r.teamName} ${r.mentor?.name ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [rows, mentorFilter, q])

  // 기수별 카드 그룹 — 필터 통과 팀을 기수 단위로 묶는다.
  const cohortGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        cohortId: string
        cohortLabel: string
        courseName: string
        teams: MentorAssignmentRow[]
      }
    >()
    for (const r of filtered) {
      const g = map.get(r.cohortId)
      if (g) g.teams.push(r)
      else
        map.set(r.cohortId, {
          cohortId: r.cohortId,
          cohortLabel: r.cohortLabel,
          courseName: r.courseName,
          teams: [r],
        })
    }
    return [...map.values()]
  }, [filtered])

  const openCreate = (teamId: string | null) => {
    setFormTeamId(teamId)
    setFormOpen(true)
  }

  // 새 배정(수강생 선택) — 반/기수는 상단 셀렉터로 고정하므로 기수 선택이 전제.
  const selectedCohortLabel = (() => {
    const c = courseConfig.data?.cohorts.find((x) => x.id === cohort)
    return c ? `${c.cohortNo}기` : ''
  })()
  const cohortTeamCount = rows.filter((r) => r.cohortId === cohort).length
  // 이 기수에서 이미 다른 팀에 배정된 수강생 — 수강생 선택 모달에 '배정됨' 표시.
  const assignedStudentIds = useMemo(
    () =>
      new Set(
        rows
          .filter((r) => r.cohortId === cohort)
          .flatMap((r) => (r.members ?? []).map((m) => m.userId)),
      ),
    [rows, cohort],
  )
  const openStudentCreate = () => {
    if (cohort === 'all') {
      toast.info('먼저 상단에서 교육과정과 기수를 선택해 주세요.')
      return
    }
    setCreateOpen(true)
  }

  return (
    <div className={embedded ? '' : 'p-8'}>
      {/* 탭 공통 툴바(ListToolbar) — 우측 [검색][필터][액션](2026-08-07 통일, 구 브랜드 카드·하드코딩 hex 버튼 정리) */}
      <div role="region" aria-label="배정 관리 도구">
        <ListToolbar
          search={{
            value: q,
            onChange: setQ,
            placeholder: '팀명·멘토명 검색',
            ariaLabel: '팀명·멘토명 검색',
          }}
          filters={
            <>
              <Select
                value={mentorFilter}
                onChange={(v) => setMentorFilter(v)}
                aria-label="멘토 필터"
                disabled={!data}
                options={[
                  { value: 'all', label: '멘토 전체' },
                  ...(data?.mentors ?? []).map((m) => ({
                    value: m.mentorId,
                    label: m.name,
                  })),
                ]}
                className="h-9"
              />
              {!embedded && (
                <>
                  <Select
                    aria-label="교육과정 선택"
                    value={course}
                    onChange={(v) => pickCourse(v)}
                    options={[
                      { value: 'all', label: '교육과정 전체' },
                      ...(courseList.data ?? []).map((c) => ({
                        value: c.courseId,
                        label: c.title,
                      })),
                    ]}
                    className="h-9"
                  />
                  <Select
                    aria-label="기수 선택"
                    value={cohort}
                    onChange={(v) => pickCohort(v)}
                    disabled={course === 'all'}
                    options={[
                      { value: 'all', label: '기수 전체' },
                      ...(courseConfig.data?.cohorts ?? []).map((c) => ({
                        value: c.id,
                        label: `${c.cohortNo}기`,
                      })),
                    ]}
                    className="h-9"
                  />
                </>
              )}
            </>
          }
          actions={
            <>
              <Link
                to="/admin/mentoring/log-templates"
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                <FileText className="h-4 w-4" />
                템플릿 관리
              </Link>
              <Button
                size="sm"
                onClick={openStudentCreate}
                disabled={cohort === 'all'}
                title={
                  cohort === 'all'
                    ? '교육과정과 기수를 선택하면 배정을 추가할 수 있어요.'
                    : undefined
                }
              >
                <Plus className="h-4 w-4" />새 배정 추가
              </Button>
            </>
          }
        />
      </div>

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonListPage kpis={4} columns={5} className="" />}
        errorTitle="배정 현황을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {data && (
          <>
            {/* 기수별 멘토링 카드 — 기수 그룹 안에 팀별 멘토링 카드 */}
            <div className="mt-6 flex flex-col gap-6">
              {cohortGroups.length === 0 ? (
                <div className="border-border bg-surface rounded-xl border p-10 text-center">
                  <p className="text-fg-subtle text-sm">
                    조건에 맞는 멘토링이 없어요
                  </p>
                </div>
              ) : (
                cohortGroups.map((group) => {
                  const assigned = group.teams.filter(
                    (t) => t.assignmentId,
                  ).length
                  const unassigned = group.teams.length - assigned
                  return (
                    <section key={group.cohortId}>
                      {/* 기수 헤더 */}
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="bg-brand h-5 w-1 rounded-full"
                            aria-hidden
                          />
                          <span className="text-fg text-[15px] font-bold">
                            {selectedCohortLabel || group.cohortLabel}
                          </span>
                          <span className="text-fg-subtle text-[12px]">
                            {selectedCourseTitle ?? group.courseName}
                          </span>
                          <span className="text-fg-muted text-[12px]">
                            · 팀 {group.teams.length} (배정 {assigned}
                            {unassigned > 0 && (
                              <span className="text-danger">
                                {' '}
                                · 미배정 {unassigned}
                              </span>
                            )}
                            )
                          </span>
                        </div>
                      </div>

                      {/* 멘토링 카드 그리드 */}
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {group.teams.map((team) => (
                          <MentoringCard
                            key={team.teamId}
                            team={team}
                            logStat={logStats.get(team.teamId)}
                            logsPending={logs.isPending}
                            onAssign={() => openCreate(team.teamId)}
                          />
                        ))}
                      </div>
                    </section>
                  )
                })
              )}
              <div className="text-fg-subtle text-xs">
                총 {data.summary.total} · 활성 {data.summary.active} · 미배정{' '}
                {data.summary.unassigned}
              </div>
            </div>

            {/* 모달 — 열림 상태에서만 마운트(폼 기본값 초기화) */}
            {createOpen && cohort !== 'all' && (
              <AssignmentCreateModal
                open
                onClose={() => setCreateOpen(false)}
                courseId={course === 'all' ? null : course}
                cohortId={cohort}
                cohortLabel={selectedCohortLabel}
                existingTeamCount={cohortTeamCount}
                assignedStudentIds={assignedStudentIds}
              />
            )}
            {formOpen && (
              <AssignmentFormModal
                open
                onClose={() => {
                  setFormOpen(false)
                  setFormTeamId(null)
                }}
                data={data}
                presetTeamId={formTeamId}
              />
            )}
          </>
        )}
      </DataBoundary>
    </div>
  )
}
