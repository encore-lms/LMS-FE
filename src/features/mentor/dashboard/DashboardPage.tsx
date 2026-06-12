import {
  AlertTriangle,
  CalendarDays,
  Check,
  FileText,
  Flag,
  Home,
  Star,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useMentorDashboard } from '../api/mentor'
import { MENTOR_FLOW_CAPTION } from '../constants'
import type { MentorTeamAssignment, MentorTodoType } from '../types'
import { remainingTone } from '../components/statusMeta'
import {
  CohortChip,
  LogStatusChip,
  TeamStatusChip,
  TeamSubTag,
} from '../components/chips'
import { SectionLink } from '../components/SectionLink'
import { TeamActionLink } from '../components/TeamActionLink'
import { TeamSummaryCard } from '../components/TeamSummaryCard'

// '해야 할 일' 행 고정 메타 — 문구는 Figma 원문(2553:3399).
const TODO_META: Record<
  MentorTodoType,
  { title: string; linkLabel: string; icon: LucideIcon }
> = {
  log_write: {
    title: '일지 작성 필요',
    linkLabel: '멘토링 일지',
    icon: FileText,
  },
  evaluation: { title: '평가 작성 필요', linkLabel: '평가 작성', icon: Star },
  recommendation: {
    title: '추천 선택 필요',
    linkLabel: '추천 선택',
    icon: Flag,
  },
  change_response: {
    title: '수정 요청 응답 필요',
    linkLabel: '일지 수정',
    icon: AlertTriangle,
  },
}

const CARD_SHELL =
  'border-border bg-surface rounded-2xl border shadow-[0_2px_8px_rgba(18,23,38,0.04)]'

// 멘토 대시보드 (/mentor · /mentor/dashboard) — Figma 2553:3399.
// Hero 배너 · 배정 팀 카드 · 해야 할 일 · 예정된 멘토링(CONFIRMED만) · 배정 팀 테이블 · 최근 일지.
// KPI Row·숫자 KPI는 삭제 정책(03_멘토.md §1) — 비용·정산·매출 표현 금지('활동 인정 요건'으로만).
export default function DashboardPage() {
  usePageHeader('대시보드', MENTOR_FLOW_CAPTION)
  const { data, isPending, isError, refetch } = useMentorDashboard()

  if (isPending) {
    return <div className="text-fg-muted p-8">대시보드를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="대시보드를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // 해야 할 일 링크 목적지 — 평가는 평가 필요 팀으로 직행, 나머지는 canonical 목록 경로.
  const evalTeam = data.teamCards.find((t) => t.status === 'evaluation_needed')
  const todoTo: Record<MentorTodoType, string> = {
    log_write: '/mentor/mentoring-logs',
    evaluation: evalTeam
      ? `/mentor/teams/${evalTeam.teamId}/evaluation`
      : '/mentor/evaluations',
    // 추천 대상 팀 직행 라우팅은 추천 PR에서 확정 — 우선 제출 완료 페이지 경로.
    recommendation: '/mentor/recommendations',
    change_response: '/mentor/mentoring-logs',
  }

  const teamColumns: Column<MentorTeamAssignment>[] = [
    {
      key: 'cohort',
      header: '반/기수',
      className: 'w-[100px]',
      cell: (t) => <CohortChip label={t.cohortLabel} />,
    },
    {
      key: 'team',
      header: '팀명',
      cell: (t) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{t.teamName}</span>
          <TeamSubTag team={t} />
        </div>
      ),
    },
    {
      key: 'members',
      header: '팀원',
      align: 'center',
      className: 'w-16',
      cell: (t) => (
        <span className="text-fg-muted text-xs">{t.memberCount}명</span>
      ),
    },
    {
      key: 'allocated',
      header: '배정',
      className: 'w-16',
      cell: (t) => (
        <span className="text-fg-muted text-xs font-bold">
          {t.allocatedHours}h
        </span>
      ),
    },
    {
      key: 'accumulated',
      header: '누적',
      className: 'w-16',
      cell: (t) => (
        <span className="text-fg text-[13px] font-bold">
          {t.accumulatedHours}h
        </span>
      ),
    },
    {
      key: 'remaining',
      header: '잔여 인정',
      className: 'w-20',
      cell: (t) => (
        <span className={cn('text-[13px] font-bold', remainingTone(t))}>
          {t.remainingHours}h
        </span>
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
      header: '다음 액션',
      className: 'w-[120px]',
      cell: (t) => <TeamActionLink team={t} context="dashboard-table" />,
    },
  ]

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* Hero 배너 — brand bg + 흰 스탯 칩 2개 */}
      <section className="bg-brand flex flex-col justify-between gap-4 rounded-2xl px-7 py-5 shadow-[0_8px_22px_rgba(26,140,133,0.18)] sm:flex-row sm:items-center">
        <div className="text-on-color flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-[1.98px]">
            MENTOR CONSOLE
          </span>
          <p className="text-[22px] leading-7 font-bold">
            안녕하세요, {data.mentor.name} 멘토님
          </p>
          <p className="text-xs font-medium opacity-90">
            {MENTOR_FLOW_CAPTION}
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <HeroStat
            label="배정 팀"
            value={String(data.mentor.assignedTeamCount)}
          />
          <HeroStat label="해야 할 일" value={`${data.mentor.todoCount}건`} />
        </div>
      </section>

      {/* 내 배정 팀 — 섹션 헤더 + 카드 3장 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-lg font-bold">내 배정 팀</h2>
          <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
            {data.teamCards.length}팀
          </span>
        </div>
        <SectionLink to="/mentor/teams" label="내 배정 팀 전체" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {data.teamCards.map((team) => (
          <TeamSummaryCard key={team.teamId} team={team} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* 해야 할 일 */}
        <section className={CARD_SHELL}>
          <header className="flex items-center justify-between gap-3 px-6 py-4">
            <div className="flex items-center gap-2">
              <Check className="text-fg h-4 w-4" />
              <h3 className="text-fg text-[15px] font-bold">해야 할 일</h3>
              <span className="bg-danger-bg text-danger rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
                {data.mentor.todoCount}건
              </span>
            </div>
            <span className="text-fg-subtle text-[11px]">
              비용 표현 없이 활동 인정 요건으로 안내
            </span>
          </header>
          <ul className="border-divider divide-divider divide-y border-t">
            {data.todos.map((todo) => {
              const meta = TODO_META[todo.type]
              const Icon = meta.icon
              return (
                <li
                  key={todo.type}
                  className="flex items-center gap-3 px-6 py-3.5"
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      todo.required
                        ? 'bg-danger-bg text-danger'
                        : 'bg-surface-muted text-fg-muted',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-fg text-[13px] font-semibold">
                      {meta.title}
                    </span>
                    <span className="text-fg-muted text-[11px]">
                      {todo.countLabel}
                    </span>
                  </div>
                  {todo.required && (
                    <span className="bg-danger-bg text-danger rounded px-[5px] py-px text-[10px] font-bold">
                      필수
                    </span>
                  )}
                  <SectionLink to={todoTo[todo.type]} label={meta.linkLabel} />
                </li>
              )
            })}
          </ul>
        </section>

        {/* 예정된 멘토링 — CONFIRMED만, 예정 시간은 인정 시간 미반영 */}
        <section className={CARD_SHELL}>
          <header className="flex items-center justify-between gap-3 px-6 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-fg h-4 w-4" />
              <h3 className="text-fg text-[15px] font-bold">예정된 멘토링</h3>
              <span className="bg-info-bg text-info rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
                {data.upcoming.confirmedCount}건 확정
              </span>
            </div>
            <SectionLink to="/mentor/mentoring-requests" label="예약" />
          </header>
          <ul className="border-divider divide-divider divide-y border-t">
            {data.upcoming.sessions.map((session, index) => (
              <li
                key={session.reservationId}
                className="flex items-center gap-3.5 px-6 py-3.5"
              >
                <div
                  className={cn(
                    'flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center rounded-[10px]',
                    index === 0
                      ? 'bg-brand text-on-color'
                      : 'bg-surface-muted text-fg',
                  )}
                >
                  <span className="text-[13px] font-bold">
                    {session.dateLabel}
                  </span>
                  <span className="text-[10px] font-medium">
                    {session.timeLabel}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <CohortChip mini label={session.cohortLabel} />
                    <span className="text-fg truncate text-[13px] font-semibold">
                      {session.teamName}
                    </span>
                  </div>
                  <div className="text-fg-muted flex items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Home className="h-[11px] w-[11px]" />
                      {session.locationTypeLabel} ·{' '}
                      {session.locationDetailLabel}
                    </span>
                    <span className="bg-divider h-3 w-px" aria-hidden />
                    <span className="flex items-center gap-1">
                      <Timer className="h-[11px] w-[11px]" />
                      예상 {session.expectedMinutes}분
                    </span>
                  </div>
                </div>
                {session.dDayLabel && (
                  <span className="bg-brand/10 text-brand rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
                    {session.dDayLabel}
                  </span>
                )}
              </li>
            ))}
            {data.upcoming.sessions.length === 0 && (
              <li className="text-fg-subtle px-6 py-8 text-center text-sm">
                예정된 멘토링이 없습니다
              </li>
            )}
          </ul>
        </section>
      </div>

      {/* 배정 팀 목록 테이블 */}
      <section className={CARD_SHELL}>
        <header className="flex items-center justify-between gap-3 px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-fg text-[15px] font-bold">배정 팀 목록</h3>
            <p className="text-fg-muted text-[11px]">
              반/기수 · 팀명 · 팀원 수 · 배정 시간 N · 실제 누적 · 잔여 인정 ·
              상태 · 다음 액션
            </p>
          </div>
          <SectionLink to="/mentor/teams" label="전체 보기" />
        </header>
        <div className="px-6 pb-6">
          <DataTable
            columns={teamColumns}
            rows={data.teamTable}
            rowKey={(t) => t.teamId}
            empty="배정된 팀이 없습니다"
          />
        </div>
      </section>

      {/* 최근 멘토링 일지 */}
      <section className={CARD_SHELL}>
        <header className="flex items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="text-fg h-4 w-4" />
            <h3 className="text-fg text-[15px] font-bold">최근 멘토링 일지</h3>
            <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-medium">
              최근 7일
            </span>
          </div>
          <SectionLink to="/mentor/mentoring-logs" label="멘토링 일지" />
        </header>
        <ul className="border-divider divide-divider divide-y border-t">
          {data.recentLogs.map((log) => (
            <li key={log.logId} className="flex items-center gap-4 px-6 py-3.5">
              <div className="flex w-10 shrink-0 flex-col">
                <span className="text-fg text-sm font-bold">
                  {log.dateLabel}
                </span>
                <span className="text-fg-subtle text-[10px]">
                  {log.yearLabel}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <CohortChip mini label={log.cohortLabel} />
                  <span className="text-fg truncate text-[13px] font-semibold">
                    {log.teamName}
                  </span>
                </div>
                <div className="text-fg-muted flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Timer className="h-[11px] w-[11px]" />
                    {log.actualMinutes}분
                  </span>
                  <span className="bg-divider h-3 w-px" aria-hidden />
                  <span className="text-fg-subtle">인정 시간</span>
                  {log.recognizedHours != null ? (
                    <span className="text-success text-xs font-bold">
                      {log.recognizedHours}h
                    </span>
                  ) : (
                    <span className="text-fg-subtle">-</span>
                  )}
                </div>
              </div>
              <LogStatusChip status={log.status} note={log.statusNote} />
              <SectionLink
                to={`/mentor/mentoring-logs/${log.logId}`}
                label="일지 보기"
              />
            </li>
          ))}
          {data.recentLogs.length === 0 && (
            <li className="text-fg-subtle px-6 py-8 text-center text-sm">
              최근 작성한 일지가 없습니다
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface flex min-w-[88px] flex-col items-center gap-0.5 rounded-[10px] px-3.5 py-[7px]">
      <span className="text-fg-subtle text-[10px] font-medium tracking-[0.8px]">
        {label}
      </span>
      <span className="text-fg text-sm font-bold">{value}</span>
    </div>
  )
}
