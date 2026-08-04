import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { CohortDirectory } from '@/components/data/CohortDirectory'
import { type Column } from '@/components/data/DataTable'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
import { useMentorTeams } from '../api/mentor'
import { MENTOR_FLOW_CAPTION } from '../constants'
import type { MentorTeamAssignment, MentorTeamStatus } from '../types'
import { MENTOR_TEAM_STATUS_LABEL } from '../types'
import { CohortChip, TeamStatusChip, TeamSubTag } from '../components/chips'
import { TeamActionLink } from '../components/TeamActionLink'

// 손이 가야 하는 팀과 끝난 팀을 가르는 탭. 상태는 7종이라 그대로 늘어놓으면 탭이 화면을
// 덮는다 — 할 일 기준으로 묶고, 특정 상태를 콕 집어 보려면 검색으로 찾는다.
type StatusFilter = 'all' | 'active' | 'evaluation_needed' | 'done'

const ACTIVE: MentorTeamStatus[] = [
  'in_progress',
  'reservation_waiting',
  'log_needed',
  'change_requested',
]
const DONE: MentorTeamStatus[] = ['completed', 'early_ended']

const matchStatus = (team: MentorTeamAssignment, filter: StatusFilter) => {
  if (filter === 'all') return true
  if (filter === 'active') return ACTIVE.includes(team.status)
  if (filter === 'done') return DONE.includes(team.status)
  return team.status === filter
}

/**
 * 내 배정 팀 (/mentor/teams) — 운영 교육과정(/admin/education)과 같은 골격.
 *
 * <p>예전에는 같은 팀이 카드로 한 번, 표로 또 한 번 나와 화면을 두 번 읽어야 했다. 게다가
 * 카드에는 손이 필요한 팀만 담겨 있어 "8팀인데 6장"처럼 수가 어긋나 보였다. 목록은 한 벌만
 * 둔다.</p>
 *
 * <p>한 반에 한 팀만 배정 — 학생 개인 목록은 없다(팀 상세 안 팀원 목록으로만 진입).</p>
 */
export default function TeamsPage() {
  usePageHeader('내 배정 팀', MENTOR_FLOW_CAPTION)
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useMentorTeams()
  const [statusParam, setStatus] = useSearchParamState('status', 'all')
  const status = statusParam as StatusFilter
  const [q, setQ] = useSearchParamState('q')

  const teams = useMemo(() => data?.teams ?? [], [data])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = teams.filter((t) => {
      if (!matchStatus(t, status)) return false
      if (!needle) return true
      // 기수·상태도 검색에 넣는다 — 담당 기수가 여럿인 멘토가 '32기'로 추릴 수 있어야 하고,
      // 탭으로 묶인 상태(예약 대기)를 이름으로 찾을 길도 남겨 둔다.
      const hay =
        `${t.teamName} ${t.cohortLabel} ${MENTOR_TEAM_STATUS_LABEL[t.status]}`.toLowerCase()
      return hay.includes(needle)
    })
    // 팀명 가나다순 고정(운영 요구)
    return [...list].sort((a, b) =>
      (a.teamName ?? '').localeCompare(b.teamName ?? '', 'ko'),
    )
  }, [teams, status, q])

  const count = (filter: StatusFilter) =>
    teams.filter((t) => matchStatus(t, filter)).length

  // CSV 내보내기 — 지금 보고 있는 목록 그대로(클라이언트 생성).
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
    const body = rows.map((t) => [
      t.cohortLabel,
      t.teamName,
      `${t.memberCount}명`,
      `${t.allocatedHours}h`,
      `${t.accumulatedHours}h`,
      `${t.recognizedHours}h`,
      t.excessHours > 0 ? `${t.excessHours}h` : '-',
      MENTOR_TEAM_STATUS_LABEL[t.status],
    ])
    const csv = [header, ...body].map((r) => r.join(',')).join('\n')
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
    <CohortDirectory<MentorTeamAssignment, StatusFilter>
      tabs={[
        { key: 'all', label: '전체', count: teams.length },
        { key: 'active', label: '진행 중', count: count('active') },
        {
          key: 'evaluation_needed',
          label: '평가 필요',
          count: count('evaluation_needed'),
        },
        { key: 'done', label: '완료', count: count('done') },
      ]}
      status={status}
      onStatusChange={setStatus}
      q={q}
      onQChange={setQ}
      searchPlaceholder="팀명·반/기수 검색"
      errorTitle="배정 팀을 불러오지 못했어요"
      scopeSummary={
        data
          ? `배정 ${data.totalTeamCount}팀 (진행 중 ${count('active')} · 평가 필요 ${count('evaluation_needed')} · 완료 ${count('done')})`
          : undefined
      }
      cards={
        data
          ? [
              {
                label: '진행 중',
                value: data.kpis.inProgress,
                unit: '팀',
                hint: 'N시간 미완료 일반 진행',
                dot: 'bg-brand',
              },
              {
                label: '예약 대기',
                value: data.kpis.reservationWaiting,
                unit: '팀',
                hint: '요청 확인 필요',
                dot: 'bg-info',
              },
              {
                label: '평가 필요',
                value: data.kpis.evaluationNeeded,
                unit: '팀',
                hint: 'N시간 완료 또는 조기 종료',
                dot: 'bg-warning',
              },
              {
                label: '수정 요청',
                value: data.kpis.changeRequested,
                unit: '팀',
                hint: '운영자 보강 요청',
                dot: 'bg-danger',
              },
            ]
          : []
      }
      toolbar={
        <button
          type="button"
          onClick={exportCsv}
          className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          <Download className="h-3 w-3" />
          CSV 내보내기
        </button>
      }
      columns={columns}
      rows={rows}
      rowKey={(t) => t.teamId}
      onRowClick={(t) => navigate(`/mentor/teams/${t.teamId}`)}
      emptyText="조건에 맞는 팀이 없어요"
      footnote="한 반에 한 팀만 배정 · 학생 개인 목록은 팀 상세 안 팀원 목록에서 확인"
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
    />
  )
}
