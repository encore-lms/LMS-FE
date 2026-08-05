import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  Home,
  Star,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useMentorDashboard } from '../api/mentor'
import { MENTOR_FLOW_CAPTION } from '../constants'
import type { MentorTeamAssignment, MentorTeamStatus } from '../types'
import { teamAction } from '../components/statusMeta'
import { CohortChip, LogStatusChip } from '../components/chips'
import { SectionLink } from '../components/SectionLink'
import LogDetailModal from '../mentoring-logs/LogDetailModal'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

// '해야 할 일' 행 고정 메타 — 문구는 Figma 원문(2553:3399).

const CARD_SHELL =
  'bg-surface rounded-2xl shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]'

// 멘토 대시보드 (/mentor · /mentor/dashboard) — Figma 2553:3399.
// Hero 배너 · 배정 팀 카드 · 해야 할 일 · 예정된 멘토링(CONFIRMED만) · 배정 팀 테이블 · 최근 일지.
// KPI Row·숫자 KPI는 삭제 정책(03_멘토.md §1) — 비용·정산·매출 표현 금지('활동 인정 요건'으로만).
export default function DashboardPage() {
  // 최근 일지 상세 — 라우트로 나가지 않고 이 화면 위에 띄운다.
  const [openLogId, setOpenLogId] = useState<string | null>(null)
  usePageHeader('대시보드', MENTOR_FLOW_CAPTION)
  const { data, isPending, isError, refetch } = useMentorDashboard()

  // 해야 할 일 링크 목적지 — 전부 팀 안으로 보낸다(2026-08-04 예약·일지·평가 탭 이관).
  // 팀을 특정할 수 있으면 그 팀 탭으로, 아니면 배정 팀 목록에서 고르게 한다.
  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonDashboard kpis={3} panels={3} className="" />}
      errorTitle="대시보드를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
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
              <HeroStat
                label="해야 할 일"
                value={`${data.mentor.todoCount}건`}
              />
            </div>
          </section>

          {/* 지금 손이 필요해요 — 대시보드의 본론. 목록은 '내 배정 팀'이 맡는다. */}
          <ActionNeeded teams={data.teamCards} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* 예정된 멘토링 — CONFIRMED만, 예정 시간은 인정 시간 미반영 */}
            <section className={CARD_SHELL}>
              <header className="flex items-center justify-between gap-3 px-6 py-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-fg h-4 w-4" />
                  <h3 className="text-fg text-[15px] font-bold">
                    예정된 멘토링
                  </h3>
                  <span className="bg-info-bg text-info rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
                    {data.upcoming.confirmedCount}건 확정
                  </span>
                </div>
                <SectionLink to="/mentor/teams" label="배정 팀" />
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

          {/* 최근 멘토링 일지 */}
          <section className={CARD_SHELL}>
            <header className="flex items-center justify-between gap-3 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="text-fg h-4 w-4" />
                <h3 className="text-fg text-[15px] font-bold">
                  최근 멘토링 일지
                </h3>
                <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-medium">
                  최근 7일
                </span>
              </div>
              <SectionLink to="/mentor/teams" label="배정 팀" />
            </header>
            <ul className="border-divider divide-divider divide-y border-t">
              {data.recentLogs.map((log) => (
                <li
                  key={log.logId}
                  className="flex items-center gap-4 px-6 py-3.5"
                >
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
                  {/* 최근 일지는 '내가 쓴 일지'라 배정이 끝난 팀 것도 섞인다. 팀으로 보내면
                      배정 가드에 막히므로, 일지 자체를 이 화면 위에서 연다. */}
                  <button
                    type="button"
                    onClick={() => setOpenLogId(log.logId)}
                    className="text-brand text-xs font-semibold whitespace-nowrap hover:underline"
                  >
                    일지 보기 →
                  </button>
                </li>
              ))}
              {data.recentLogs.length === 0 && (
                <li className="text-fg-subtle px-6 py-8 text-center text-sm">
                  최근 작성한 일지가 없습니다
                </li>
              )}
            </ul>
          </section>

          {/* 목록은 여기서 보여 주지 않는다 — 가는 길만 둔다 */}
          <Link
            to="/mentor/teams"
            className="border-border text-fg-muted hover:bg-surface-muted flex items-center justify-center gap-1.5 rounded-2xl border border-dashed py-4 text-[13px] font-semibold"
          >
            <Users className="h-4 w-4" />내 배정 팀{' '}
            {data.mentor.assignedTeamCount}팀 전체 보기
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
      {openLogId && (
        <LogDetailModal logId={openLogId} onClose={() => setOpenLogId(null)} />
      )}
    </DataBoundary>
  )
}

/**
 * 지금 손이 필요해요 — 대시보드가 답해야 하는 단 하나의 질문.
 *
 * <p>예전에는 배정 팀 카드 8장이 첫 화면을 다 먹고, 정작 할 일은 한참 아래에 있었다.
 * 게다가 같은 팀이 카드로 한 번·표로 또 한 번, '내 배정 팀' 메뉴에서 또 한 번 나왔다.</p>
 *
 * <p>할 일은 팀 상태에서 뽑는다 — BE 의 todos 는 건수만 주고 어느 팀인지가 없어, 무엇을
 * 눌러야 하는지 알 수 없었다.</p>
 */
const ACTION_GROUPS: {
  status: MentorTeamStatus
  title: string
  hint: string
  tone: string
  icon: LucideIcon
}[] = [
  {
    status: 'change_requested',
    title: '일지 수정 요청',
    hint: '운영자가 보완을 요청했어요 · 전체 수정 후 재제출',
    tone: 'bg-danger-bg text-danger',
    icon: AlertTriangle,
  },
  {
    status: 'evaluation_needed',
    title: '평가 필요',
    hint: '팀원 5축 평가와 추천을 남겨 주세요',
    tone: 'bg-warning-bg text-warning',
    icon: Star,
  },
  {
    status: 'log_needed',
    title: '일지 작성',
    hint: '진행한 멘토링을 기록해 주세요',
    tone: 'bg-info-bg text-info',
    icon: FileText,
  },
  {
    status: 'reservation_waiting',
    title: '예약 요청 확인',
    hint: '수강생이 보낸 요청에 답해 주세요',
    tone: 'bg-accent-bg text-accent-strong',
    icon: CalendarDays,
  },
]

function ActionNeeded({ teams }: { teams: MentorTeamAssignment[] }) {
  const groups = ACTION_GROUPS.map((g) => ({
    ...g,
    hit: teams.filter((t) => t.status === g.status),
  })).filter((g) => g.hit.length > 0)

  if (groups.length === 0) {
    return (
      <section
        className={cn(
          CARD_SHELL,
          'flex flex-col items-center gap-2 px-6 py-10',
        )}
      >
        <span className="bg-success-bg text-success flex size-11 items-center justify-center rounded-full">
          <Check className="size-5" />
        </span>
        <h2 className="text-fg text-[15px] font-bold">지금 할 일이 없어요</h2>
        <p className="text-fg-muted text-[13px]">
          새 요청이나 보완 요청이 오면 여기에 뜹니다.
        </p>
      </section>
    )
  }

  return (
    <section className={CARD_SHELL}>
      <header className="flex items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-danger h-4 w-4" />
          <h2 className="text-fg text-[15px] font-bold">지금 손이 필요해요</h2>
          <span className="bg-danger-bg text-danger rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
            {groups.reduce((n, g) => n + g.hit.length, 0)}팀
          </span>
        </div>
      </header>
      <ul className="border-divider divide-divider divide-y border-t">
        {groups.map((group) => (
          <li key={group.status} className="flex flex-col gap-2.5 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  group.tone,
                )}
              >
                <group.icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-fg text-[13px] font-bold">
                {group.title}
              </span>
              <span className="text-fg-muted text-[11px]">{group.hint}</span>
              <span className="text-fg-subtle ml-auto text-[11px] font-semibold">
                {group.hit.length}팀
              </span>
            </div>
            {/* 팀마다 바로 그 자리로 — 무엇을 눌러야 하는지 고민하지 않게 */}
            <ul className="flex flex-col gap-1.5 pl-[38px]">
              {group.hit.map((team) => {
                const action = teamAction(team, 'dashboard-table')
                return (
                  <li
                    key={team.teamId}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <CohortChip mini label={team.cohortLabel} />
                    <span className="text-fg text-[13px] font-semibold">
                      {team.teamName}
                    </span>
                    <span className="text-fg-subtle text-[11px]">
                      인정 {team.recognizedHours}h / 배정 {team.allocatedHours}h
                    </span>
                    <Link
                      to={action.to}
                      className="border-border text-fg-muted hover:bg-surface-muted ml-auto inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
                    >
                      {action.label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </section>
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
