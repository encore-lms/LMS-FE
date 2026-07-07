import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  Download,
  Info,
  Search,
  Send,
  Star,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useMentorTeams } from '../api/mentor'
import { MENTOR_FLOW_CAPTION } from '../constants'
import type { MentorTeamAssignment, MentorTeamStatus } from '../types'
import { MENTOR_TEAM_STATUS_LABEL } from '../types'
import { CohortChip, TeamStatusChip, TeamSubTag } from '../components/chips'
import { TeamActionLink } from '../components/TeamActionLink'
import { TeamSummaryCard } from '../components/TeamSummaryCard'
import { SkeletonListPage } from '@/components/ui/Skeleton'

type StatusFilter = 'all' | 'action' | MentorTeamStatus

// 상태 필터 — Figma 표기값 '진행 중 + 평가 필요'(action 조합) 포함.
// 기본값은 '전체': Figma 기본 표기는 '진행 중 + 평가 필요'지만 목록에 수정 요청·완료 팀이
// 함께 노출돼 필터-목록 연동 스펙 미확정(openQuestion) — 전체 노출을 기본으로 둔다.
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'action', label: '진행 중 + 평가 필요' },
  ...(Object.keys(MENTOR_TEAM_STATUS_LABEL) as MentorTeamStatus[]).map(
    (status) => ({ value: status, label: MENTOR_TEAM_STATUS_LABEL[status] }),
  ),
]

const matchStatus = (team: MentorTeamAssignment, filter: StatusFilter) => {
  if (filter === 'all') return true
  if (filter === 'action')
    return team.status === 'in_progress' || team.status === 'evaluation_needed'
  return team.status === filter
}

// 내 배정 팀 (/mentor/teams) — Figma 2553:3554.
// 필터 바 · KPI 4 · 팀 카드(좌측 상태 바 변형) · 배정 팀 전체 테이블 + CSV 내보내기.
// 한 반에 한 팀만 배정 — 학생 개인 목록 없음(팀 상세 안 팀원 목록으로만 진입).
export default function TeamsPage() {
  usePageHeader('내 배정 팀', MENTOR_FLOW_CAPTION)
  const { data, isPending, isError, refetch } = useMentorTeams()
  const [course, setCourse] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')

  const teams = useMemo(() => data?.teams ?? [], [data])
  const cohorts = useMemo(
    () => [...new Set(teams.map((t) => t.cohortLabel))],
    [teams],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = teams.filter((t) => {
      if (course !== 'all' && t.cohortLabel !== course) return false
      if (!matchStatus(t, status)) return false
      if (needle) {
        const hay = `${t.teamName} ${t.cohortLabel}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    // 팀명 가나다순 고정(운영 요구)
    return [...list].sort((a, b) => a.teamName.localeCompare(b.teamName, 'ko'))
  }, [teams, course, status, q])

  // 카드 노출 = 액션 필요 팀만(완료·조기 종료 제외, Figma 3장) — 노출 기준 BE 확정 대기 TODO.
  const cards = filtered.filter(
    (t) => t.status !== 'completed' && t.status !== 'early_ended',
  )

  if (isPending) {
    return <SkeletonListPage kpis={4} columns={5} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="배정 팀을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // CSV 내보내기 — 현재 필터 기준 배정 팀 전체 테이블 다운로드(클라이언트 생성).
  const exportCsv = () => {
    const header = [
      '반/기수',
      '팀명',
      '팀원 수',
      '배정 시간',
      '실제 누적',
      '인정 시간',
      '초과 시간',
      '상태',
    ]
    const rows = filtered.map((t) => [
      t.cohortLabel,
      t.teamName,
      `${t.memberCount}명`,
      `${t.allocatedHours}h`,
      `${t.accumulatedHours}h`,
      `${t.recognizedHours}h`,
      t.excessHours > 0 ? `${t.excessHours}h` : '-',
      MENTOR_TEAM_STATUS_LABEL[t.status],
    ])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    // BOM — 엑셀 한글 인코딩 호환
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '배정_팀_전체.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<MentorTeamAssignment>[] = [
    {
      key: 'cohort',
      header: '반/기수',
      className: 'w-[90px]',
      cell: (t) => <CohortChip label={t.cohortLabel} />,
    },
    {
      key: 'team',
      header: '팀명',
      cell: (t) => (
        <div className="flex flex-col items-start gap-1">
          <span className="font-semibold">{t.teamName}</span>
          <TeamSubTag team={t} />
        </div>
      ),
    },
    {
      key: 'members',
      header: '팀원',
      align: 'right',
      className: 'w-14',
      cell: (t) => (
        <span className="text-fg-muted text-xs font-bold">
          {t.memberCount}명
        </span>
      ),
    },
    {
      key: 'allocated',
      header: '배정',
      align: 'right',
      className: 'w-14',
      cell: (t) => (
        <span className="text-fg-muted text-xs font-bold">
          {t.allocatedHours}h
        </span>
      ),
    },
    {
      key: 'accumulated',
      header: '누적',
      align: 'right',
      className: 'w-14',
      cell: (t) => (
        <span className="text-fg text-xs font-bold">{t.accumulatedHours}h</span>
      ),
    },
    {
      key: 'recognized',
      header: '인정',
      align: 'right',
      className: 'w-14',
      cell: (t) => (
        <span className="text-success text-xs font-bold">
          {t.recognizedHours}h
        </span>
      ),
    },
    {
      key: 'excess',
      header: '초과',
      align: 'right',
      className: 'w-14',
      cell: (t) =>
        t.excessHours > 0 ? (
          <span className="text-accent-strong text-xs font-bold">
            {t.excessHours}h
          </span>
        ) : (
          <span className="text-fg-subtle text-xs">-</span>
        ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-[110px]',
      cell: (t) => <TeamStatusChip status={t.status} />,
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-[110px]',
      cell: (t) => <TeamActionLink team={t} context="teams-table" />,
    },
  ]

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* 필터 바 — 과정/기수 · 상태 · 팀명/반기수 검색 */}
      <section className="border-border bg-surface flex flex-col gap-3 rounded-xl border px-4 py-3 shadow-[0_2px_8px_rgba(18,23,38,0.04)] md:flex-row">
        <FilterSelect
          icon={Send}
          label="과정/기수"
          ariaLabel="과정/기수 필터"
          value={course}
          onChange={setCourse}
          options={[
            { value: 'all', label: '전체' },
            ...cohorts.map((c) => ({ value: c, label: c })),
          ]}
        />
        <FilterSelect
          icon={Info}
          label="상태"
          ariaLabel="상태 필터"
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={STATUS_OPTIONS}
        />
        <label className="border-border flex h-10 flex-1 items-center gap-2 rounded-[10px] border px-3.5">
          <Search className="text-fg-subtle h-3.5 w-3.5 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="팀명·반/기수 검색"
            aria-label="팀명·반/기수 검색"
            className="text-fg placeholder:text-fg-subtle min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          />
        </label>
      </section>

      {/* KPI 4 — 우상단 아이콘은 Figma KPI 카드 정합(내 배정 팀 2553:3554) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="진행 중"
          icon={<Timer className="text-brand h-4 w-4" />}
          value={<KpiValue count={data.kpis.inProgress} />}
          hint="N시간 미완료 일반 진행"
        />
        <KpiCard
          label="예약 대기"
          icon={<Calendar className="text-info h-4 w-4" />}
          value={
            <KpiValue
              count={data.kpis.reservationWaiting}
              // Figma 원본 조합: warning-bg 배경 + info 글자(디자인 확인 openQuestion — 원본 유지)
              badge={{
                label: '확인 필요',
                className: 'bg-warning-bg text-info',
              }}
            />
          }
          hint="요청 확인 필요"
        />
        <KpiCard
          label="평가 필요"
          icon={<Star className="text-warning h-4 w-4" />}
          value={
            <KpiValue
              count={data.kpis.evaluationNeeded}
              badge={{ label: '필수', className: 'bg-warning-bg text-warning' }}
            />
          }
          hint="N시간 완료 또는 조기 종료"
        />
        <KpiCard
          label="수정 요청"
          icon={<AlertTriangle className="text-danger h-4 w-4" />}
          value={
            <KpiValue
              count={data.kpis.changeRequested}
              badge={{
                label: '조치 필요',
                className: 'bg-danger-bg text-danger',
              }}
            />
          }
          hint="운영자 보강 요청"
        />
      </div>

      {/* 내 배정 팀 — 섹션 헤더 + 카드(좌측 상태 바 변형) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-lg font-bold">내 배정 팀</h2>
          <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
            {data.totalTeamCount}팀
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          한 반에 한 팀만 배정 · 학생 개인 목록은 팀 상세 안 팀원 목록에서 확인
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {cards.map((team) => (
          <TeamSummaryCard key={team.teamId} team={team} withStatusBar />
        ))}
        {cards.length === 0 && (
          <div className="lg:col-span-3">
            <Empty title="조건에 맞는 팀이 없어요" />
          </div>
        )}
      </div>

      {/* 배정 팀 전체 테이블 + CSV 내보내기 */}
      <section className="border-border bg-surface rounded-2xl border shadow-[0_2px_8px_rgba(18,23,38,0.04)]">
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-fg text-[15px] font-bold">
              배정 팀 전체 ({filtered.length}팀)
            </h3>
            <p className="text-fg-muted text-[11px]">
              반/기수 · 팀명 · 팀원 수 · 배정 시간 · 실제 누적 · 인정 시간 ·
              초과 시간 · 상태 · 액션
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            <Download className="h-3 w-3" />
            CSV 내보내기
          </button>
        </header>
        <div className="px-6 pb-6">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(t) => t.teamId}
            empty="조건에 맞는 팀이 없어요"
          />
        </div>
      </section>
    </div>
  )
}

// KPI 값 행 — 큰 숫자 + '팀' 단위 + (해당 시) 보조 칩.
function KpiValue({
  count,
  badge,
}: {
  count: number
  badge?: { label: string; className: string }
}) {
  return (
    <span className="flex items-center gap-1.5">
      {count}
      <span className="text-fg-muted text-[13px] font-medium">팀</span>
      {badge && (
        <span
          className={cn(
            'rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold',
            badge.className,
          )}
        >
          {badge.label}
        </span>
      )}
    </span>
  )
}

// 필터 셀렉트 — 아이콘 + 라벨 + 굵은 현재값 + caret(Figma 컨트롤 재현, 네이티브 select).
function FilterSelect({
  icon: Icon,
  label,
  ariaLabel,
  value,
  onChange,
  options,
}: {
  icon: LucideIcon
  label: string
  ariaLabel: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="border-border flex h-10 flex-1 items-center gap-2 rounded-[10px] border px-3.5">
      <Icon className="text-fg-muted h-3.5 w-3.5 shrink-0" />
      <span className="text-fg-subtle text-[11px] font-medium whitespace-nowrap">
        {label}
      </span>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-fg min-w-0 flex-1 appearance-none bg-transparent text-xs font-bold outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="text-fg-subtle pointer-events-none h-2.5 w-2.5 shrink-0" />
    </div>
  )
}
