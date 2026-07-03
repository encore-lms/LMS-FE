import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Clock,
  FileText,
  Plus,
  Star,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { cn } from '@/shared/lib/cn'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
import { useMentorAssignments } from './api'
import {
  ASSIGNMENT_STATUS_META,
  assignmentDisplayStatus,
  progressFillClass,
} from './statusMeta'
import { AssignmentFormModal } from './AssignmentFormModal'
import { AssignmentManageModal } from './AssignmentManageModal'
import { EarlyEndModal } from './EarlyEndModal'
import { MentoringTabs } from './MentoringTabs'
import type { MentorAssignmentRow } from './types'

// 배정 제약 · §29 정책 — Figma 2744:7725 원문.
const POLICY_ROWS: { key: string; desc: string }[] = [
  { key: '반별 배정', desc: '한 반에 한 팀만 배정 가능' },
  { key: '멘토별 배정', desc: '여러 반에 각각 한 팀씩 배정 가능' },
  { key: 'N시간', desc: '팀 배정 단위로 설정' },
  {
    key: '일지 템플릿',
    desc: '배정 시 기본 템플릿 선택 (일지 템플릿에서 관리)',
  },
  {
    key: '조기 종료',
    desc: '운영자가 팀을 조기 종료 처리하면 평가 가능 상태로 전환',
  },
]

/** 누적 인정 셀 — 'Xh NN%' + 진행바(트랙 surface-muted, fill 상태색). */
function RecognizedCell({ row }: { row: MentorAssignmentRow }) {
  if (row.recognizedHours === null || row.recognizedPct === null) {
    return <span className="text-fg-subtle font-medium">-</span>
  }
  const pct = row.recognizedPct
  return (
    <div className="flex w-28 flex-col gap-1.5">
      <span className="text-fg text-xs font-bold">
        {row.recognizedHours}h{' '}
        <span className="text-fg-muted font-medium">{pct}%</span>
      </span>
      <div className="bg-surface-muted h-[5px] w-full overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full', progressFillClass(pct))}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

// 멘토 배정 관리 (/admin/mentors/assignments) — 운영(MANAGER/ADMIN).
// 반/기수별 팀 배정 · N시간 · 일지 템플릿 관리. (Figma "운영 — 멘토 배정 관리" 2744:7725)
export default function AssignmentsPage() {
  usePageHeader(
    '멘토 배정 관리',
    '반/기수별 멘토 팀 배정 · 배정 시간 N · 일지 템플릿 · 한 반에 한 팀만',
  )
  const { data, isPending, isError, refetch } = useMentorAssignments()
  const [course, setCourse] = useSearchParamState('course', 'all')
  const [mentorFilter, setMentorFilter] = useSearchParamState('mentor', 'all')
  const [status, setStatus] = useSearchParamState('status', 'with_unassigned')
  const [q, setQ] = useSearchParamState('q')
  const [formTeamId, setFormTeamId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [manageRow, setManageRow] = useState<MentorAssignmentRow | null>(null)
  const [earlyEndRow, setEarlyEndRow] = useState<MentorAssignmentRow | null>(
    null,
  )

  const rows = useMemo(() => data?.rows ?? [], [data])
  const courses = useMemo(
    () => [...new Set(rows.map((r) => r.courseName))],
    [rows],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (course !== 'all' && r.courseName !== course) return false
      if (mentorFilter !== 'all' && r.mentor?.mentorId !== mentorFilter)
        return false
      if (status === 'active_only' && !r.assignmentId) return false
      if (status === 'unassigned_only' && r.assignmentId) return false
      if (needle) {
        const hay = `${r.teamName} ${r.mentor?.name ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [rows, course, mentorFilter, status, q])

  if (isPending) {
    return <div className="text-fg-muted p-8">배정 현황을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="배정 현황을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const openCreate = (teamId: string | null) => {
    setFormTeamId(teamId)
    setFormOpen(true)
  }

  const columns: Column<MentorAssignmentRow>[] = [
    {
      key: 'cohort',
      header: '반/기수',
      className: 'w-28',
      cell: (r) => (
        <div className="flex flex-col">
          <span className="text-fg text-xs font-bold">{r.cohortLabel}</span>
          <span className="text-fg-subtle text-[11px]">{r.courseName}</span>
        </div>
      ),
    },
    {
      key: 'team',
      header: '팀명',
      cell: (r) => (
        <span className="text-fg text-[13px] font-bold">{r.teamName}</span>
      ),
    },
    {
      key: 'mentor',
      header: '멘토',
      className: 'w-36',
      cell: (r) =>
        r.mentor ? (
          <div className="flex items-center gap-2">
            <Avatar name={r.mentor.name} size={28} />
            <span className="text-fg text-xs font-bold">{r.mentor.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="bg-fg-subtle text-on-color inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              ?
            </span>
            <span className="text-fg-subtle text-xs font-medium">미배정</span>
          </div>
        ),
    },
    {
      key: 'members',
      header: '팀원',
      className: 'w-16',
      cell: (r) => (
        <span className="text-fg text-xs font-bold">{r.memberCount}명</span>
      ),
    },
    {
      key: 'allocated',
      header: '배정 N시간',
      className: 'w-24',
      cell: (r) =>
        r.allocatedHours !== null ? (
          <span className="text-fg text-[13px] font-bold">
            {r.allocatedHours}h
          </span>
        ) : (
          <span className="text-fg-subtle font-medium">-</span>
        ),
    },
    {
      key: 'recognized',
      header: '누적 인정',
      className: 'w-32',
      cell: (r) => <RecognizedCell row={r} />,
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (r) => {
        const meta = ASSIGNMENT_STATUS_META[assignmentDisplayStatus(r)]
        return <StatusBadge label={meta.label} tone={meta.tone} />
      },
    },
    {
      key: 'actions',
      header: '액션',
      align: 'right',
      className: 'w-56',
      cell: (r) => {
        if (!r.assignmentId) {
          return (
            <button
              type="button"
              onClick={() => openCreate(r.teamId)}
              className="bg-danger text-on-color hover:bg-danger/90 inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold"
            >
              <UserPlus className="h-3 w-3" />
              배정
            </button>
          )
        }
        const displayStatus = assignmentDisplayStatus(r)
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setManageRow(r)}
              className="border-border text-fg-muted hover:bg-surface-muted bg-surface rounded-md border px-2.5 py-1.5 text-[11px] font-bold"
            >
              수정
            </button>
            {/* 팀별 일지 항목(§32) 진입 — 해당 화면 브레드크럼이 '멘토 배정 관리'로 복귀 */}
            <Link
              to={`/admin/mentoring/teams/${r.teamId}/log-fields`}
              className="border-border text-fg-muted hover:bg-surface-muted bg-surface rounded-md border px-2.5 py-1.5 text-[11px] font-bold"
            >
              일지 항목
            </Link>
            {displayStatus === 'in_progress' && (
              <button
                type="button"
                onClick={() => setEarlyEndRow(r)}
                className="border-warning text-warning hover:bg-warning/10 bg-surface rounded-md border px-2.5 py-1.5 text-[11px] font-bold"
              >
                조기 종료
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-8">
      <MentoringTabs />
      {/* Hero — 정책 칩 + 미배정 경고 칩 + CTA */}
      <div className="bg-brand shadow-hero flex flex-wrap items-center justify-between gap-4 rounded-2xl px-7 py-6">
        <div className="flex flex-col gap-3">
          <p className="text-on-color text-lg font-bold">
            반/기수별 팀 배정 · N시간 · 일지 템플릿 관리
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-surface text-fg rounded-md px-2.5 py-1 text-[11px] font-bold">
              한 반에 한 팀만 배정
            </span>
            {data.kpis.unassignedTeams > 0 && (
              <span className="bg-warning-bg text-warning inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold">
                <AlertTriangle className="h-3 w-3" />
                멘토 미배정 팀 {data.kpis.unassignedTeams}건
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => openCreate(null)}
          className="bg-surface text-fg hover:bg-surface/90 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-bold"
        >
          <Plus className="h-4 w-4" />새 배정 추가
        </button>
      </div>

      {/* KPI 4 — 값은 mock 상태 파생(배정·조기 종료 즉시 반영) */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="활성 멘토"
          value={
            <span className="flex items-center gap-2">
              <span className="bg-accent-bg text-accent-strong inline-flex h-9 w-9 items-center justify-center rounded-xl">
                <Star className="h-4 w-4" />
              </span>
              {data.kpis.activeMentors}
            </span>
          }
          hint="운영 중 배정 보유"
        />
        <KpiCard
          label="활성 팀 배정"
          value={
            <span className="flex items-center gap-2">
              <span className="bg-brand/10 text-brand inline-flex h-9 w-9 items-center justify-center rounded-xl">
                <FileText className="h-4 w-4" />
              </span>
              {data.kpis.activeAssignments}
            </span>
          }
          hint={data.kpis.activeAssignmentsHint}
        />
        <KpiCard
          label="멘토 미배정 팀"
          value={
            <span className="flex items-center gap-2">
              <span className="bg-warning-bg text-warning inline-flex h-9 w-9 items-center justify-center rounded-xl">
                <AlertTriangle className="h-4 w-4" />
              </span>
              {data.kpis.unassignedTeams}
            </span>
          }
          tone="warning"
          hint={data.kpis.unassignedTeamsHint}
        />
        <KpiCard
          label="조기 종료"
          value={
            <span className="flex items-center gap-2">
              <span className="bg-success-bg text-success inline-flex h-9 w-9 items-center justify-center rounded-xl">
                <Clock className="h-4 w-4" />
              </span>
              {data.kpis.earlyEnded}
            </span>
          }
          hint="평가 가능 상태 전환"
        />
      </div>

      {/* 필터 바 */}
      <div className="border-border bg-surface mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            aria-label="과정 필터"
            className="border-border text-fg-muted focus:border-brand bg-surface h-9 rounded-lg border px-3 text-sm outline-none"
          >
            <option value="all">과정 전체</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={mentorFilter}
            onChange={(e) => setMentorFilter(e.target.value)}
            aria-label="멘토 필터"
            className="border-border text-fg-muted focus:border-brand bg-surface h-9 rounded-lg border px-3 text-sm outline-none"
          >
            <option value="all">멘토 전체</option>
            {data.mentors.map((m) => (
              <option key={m.mentorId} value={m.mentorId}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="배정 상태 필터"
            className="border-border text-fg-muted focus:border-brand bg-surface h-9 rounded-lg border px-3 text-sm outline-none"
          >
            <option value="with_unassigned">미배정 포함</option>
            <option value="active_only">배정만</option>
            <option value="unassigned_only">미배정만</option>
          </select>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="팀명·멘토명 검색"
          aria-label="팀명·멘토명 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-9 w-60 rounded-lg border px-3 text-sm outline-none"
        />
      </div>

      {/* 배정 테이블 — 미배정 행은 경고 변형(danger 좌측 보더) */}
      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.teamId}
          rowClassName={(r) =>
            !r.assignmentId ? 'border-l-4 border-l-danger bg-danger-bg/20' : ''
          }
          empty="조건에 맞는 팀이 없어요"
        />
        <div className="text-fg-subtle mt-3 text-xs">
          총 {data.summary.total} · 활성 {data.summary.active} · 미배정{' '}
          {data.summary.unassigned}
        </div>
      </div>

      {/* 배정 제약 · §29 정책 */}
      <div className="border-border bg-surface mt-8 rounded-xl border">
        <div className="px-5 pt-5 pb-3">
          <p className="text-fg text-sm font-bold">배정 제약 정책</p>
          <p className="text-fg-subtle mt-1 text-xs">
            저장 전 자동 검증 — 같은 반 중복 배정·미배정 팀·템플릿 미선택 차단
          </p>
        </div>
        <ul className="divide-divider divide-y">
          {POLICY_ROWS.map((row) => (
            <li key={row.key} className="flex items-center gap-4 px-5 py-3">
              <span className="bg-brand/10 text-brand w-32 shrink-0 rounded-md px-2.5 py-1 text-center text-[11px] font-bold">
                {row.key}
              </span>
              <span className="text-fg-muted text-xs font-medium">
                {row.desc}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 예외 경고 · 저장 전 자동 검출 */}
      <div className="bg-warning-bg border-warning/40 mt-4 rounded-xl border p-5">
        <p className="text-fg text-sm font-bold">
          예외 경고 · 저장 전 자동 검출
        </p>
        <ul className="text-fg-muted mt-2 flex flex-col gap-1 text-xs">
          <li>
            • 같은 반 중복 배정 — 동일 cohort에 이미 팀이 배정된 멘토 (저장
            차단)
          </li>
          <li>
            • 멘토 미배정 팀 — N시간·템플릿 모두 비어 있으면 운영 큐에 노출
            (현재 {data.kpis.unassignedTeams}건)
          </li>
          <li>• 템플릿 미선택 — 배정 폼에서 일지 템플릿 필수 선택 안내</li>
        </ul>
      </div>

      {/* 모달 — 열림 상태에서만 마운트(폼 기본값 초기화) */}
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
      {manageRow && (
        <AssignmentManageModal
          open
          onClose={() => setManageRow(null)}
          row={manageRow}
          data={data}
        />
      )}
      {earlyEndRow && (
        <EarlyEndModal
          open
          onClose={() => setEarlyEndRow(null)}
          row={earlyEndRow}
        />
      )}
    </div>
  )
}
