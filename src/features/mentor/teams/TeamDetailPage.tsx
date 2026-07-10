import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Flag,
  Send,
  Star,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useMentorTeamDetail } from '../api/mentor'
import { MENTOR_FLOW_CAPTION } from '../constants'
import type { MentorTeamLogRow } from '../types'
import { CohortChip, LogStatusChip, TeamStatusChip } from '../components/chips'
import { ProgressBar } from '../components/ProgressBar'
import { SectionLink } from '../components/SectionLink'

const CARD_SHELL =
  'bg-surface rounded-2xl shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]'

// 팀 상세 (/mentor/teams/:teamId) — Figma 2553:3696.
// 팀 헤더(배정·누적·잔여) · 팀원 · 예약 요약 · 평가·추천(잠금 사유 표시) · 팀 최근 일지.
// 헤더 타이틀은 고정 '팀 상세'(팀명은 본문 카드에만 — Figma 기준).
export default function TeamDetailPage() {
  usePageHeader('팀 상세', MENTOR_FLOW_CAPTION)
  const { teamId = '' } = useParams()
  const { data, isPending, isError, refetch } = useMentorTeamDetail(teamId)

  if (isPending) {
    return <div className="text-fg-muted p-8">팀 정보를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="팀 정보를 불러오지 못했어요"
          description="본인에게 배정된 팀만 열람할 수 있어요."
          action={
            <div className="flex items-center gap-2">
              <Button onClick={() => refetch()}>다시 시도</Button>
              <Link
                to="/mentor/teams"
                className="border-border text-fg hover:bg-surface-muted flex h-14 items-center rounded-[11px] border bg-white px-5 text-[15px] font-bold"
              >
                내 배정 팀으로
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  const team = data.assignment

  const logColumns: Column<MentorTeamLogRow>[] = [
    {
      key: 'datetime',
      header: '일시',
      className: 'w-[120px]',
      cell: (r) => (
        <span className="text-fg-muted text-xs font-medium whitespace-nowrap">
          {r.datetimeLabel}
        </span>
      ),
    },
    {
      key: 'location',
      header: '장소',
      className: 'w-[160px]',
      cell: (r) => (
        <span className="text-fg-muted text-xs font-medium">
          {r.locationLabel}
        </span>
      ),
    },
    {
      key: 'actual',
      header: '실제',
      align: 'right',
      className: 'w-16',
      cell: (r) => (
        <span className="text-fg-muted text-xs font-medium">
          {r.actualMinutes}분
        </span>
      ),
    },
    {
      key: 'recognized',
      header: '인정',
      align: 'right',
      className: 'w-16',
      cell: (r) =>
        r.recognizedHours != null ? (
          <span className="text-success text-[13px] font-bold">
            {r.recognizedHours}h
          </span>
        ) : (
          <span className="text-fg-subtle text-xs">-</span>
        ),
    },
    {
      key: 'summary',
      header: '요지',
      cell: (r) => (
        <span className="text-fg text-xs font-medium">{r.summary}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-[140px]',
      cell: (r) => <LogStatusChip status={r.status} note={r.statusNote} />,
    },
    {
      key: 'action',
      header: '액션',
      align: 'right',
      className: 'w-[90px]',
      cell: (r) => (
        <Link
          to={`/mentor/mentoring-logs/${r.logId}`}
          className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-lg border px-2.5 py-[5px] text-[11px] font-medium whitespace-nowrap"
        >
          열기
          <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-2">
        <Link
          to="/mentor/teams"
          className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-2.5 py-[5px] text-xs font-medium"
        >
          <ArrowLeft className="h-3 w-3" />내 배정 팀
        </Link>
        <span className="text-fg-subtle text-[13px]">›</span>
        <span className="text-fg text-xs font-medium">
          {team.cohortLabel} · {team.teamName}
        </span>
      </div>

      {/* 팀 헤더 카드 */}
      <section
        className={cn(
          CARD_SHELL,
          'flex flex-wrap items-center justify-between gap-6 px-6 py-5',
        )}
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <CohortChip label={team.cohortLabel} />
            <TeamStatusChip status={team.status} />
          </div>
          <h2 className="text-fg text-[22px] leading-7 font-bold">
            {team.teamName}
          </h2>
          <div className="text-fg-muted flex flex-wrap items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1">
              <Send className="h-3 w-3" />
              팀원 {team.memberCount}명
            </span>
            <Dot />
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {data.periodLabel}
            </span>
            <Dot />
            <span className="flex items-center gap-1">
              <Flag className="h-3 w-3" />
              담당 멘토 {data.mentorName}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <HeaderKpi
            label="배정 N시간"
            value={`${team.allocatedHours}h`}
            valueClass="text-fg"
          />
          <span className="bg-border mx-5 h-10 w-px" aria-hidden />
          <HeaderKpi
            label="누적 인정"
            value={`${team.recognizedHours}h`}
            valueClass="text-brand"
          />
          <span className="bg-border mx-5 h-10 w-px" aria-hidden />
          {/* 잔여>0 = warning 가정(Figma 4h=warning) — 임계 규칙 미확정 TODO */}
          <HeaderKpi
            label="잔여 인정"
            value={`${team.remainingHours}h`}
            valueClass={
              team.remainingHours > 0 ? 'text-warning' : 'text-success'
            }
          />
        </div>
      </section>

      {/* 팀원 · 예약 · 평가·추천 3열 */}
      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        {/* 팀원 */}
        <section className={cn(CARD_SHELL, 'flex flex-col')}>
          <header className="flex items-center justify-between gap-2 px-5 py-4">
            <div className="flex items-center gap-2">
              <Send className="text-fg h-4 w-4" />
              <h3 className="text-fg text-sm font-bold">팀원</h3>
              <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
                {data.members.length}명
              </span>
            </div>
            {/* 헤더 링크 대상 미정(Figma 모호) — 첫 팀원 상세로 연결 */}
            {data.members[0] && (
              <SectionLink
                to={`/mentor/mentees/${data.members[0].studentId}`}
                label="학생 상세"
              />
            )}
          </header>
          <ul className="divide-divider divide-y">
            {data.members.map((member) => (
              <li key={member.studentId}>
                <Link
                  to={`/mentor/mentees/${member.studentId}`}
                  className="hover:bg-surface-muted flex items-center gap-3 px-5 py-2.5"
                >
                  {/* 아바타 색은 공통 Avatar 이름 해시 팔레트(고정 색 규칙 미확정 openQuestion) */}
                  <Avatar name={member.name} size={32} />
                  <span className="text-fg text-[13px] font-semibold">
                    {member.name}
                  </span>
                  {member.role === 'pm' ? (
                    <span className="bg-accent-strong text-on-color rounded px-[5px] py-px text-[9px] font-bold">
                      PM
                    </span>
                  ) : (
                    <span className="bg-surface-muted text-fg-subtle rounded px-[5px] py-px text-[9px] font-bold">
                      팀원
                    </span>
                  )}
                  <ChevronRight className="text-fg-subtle ml-auto h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 예약 */}
        <section className={cn(CARD_SHELL, 'flex flex-col gap-3.5 p-5')}>
          <header className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="text-fg h-4 w-4" />
              <h3 className="text-fg text-sm font-bold">예약</h3>
            </div>
            <SectionLink
              to={`/mentor/mentoring-requests?teamId=${team.teamId}`}
              label="예약"
            />
          </header>
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              value={data.reservationSummary.inProgress}
              label="진행 중"
              className="bg-brand/10 text-brand"
            />
            <StatTile
              value={data.reservationSummary.confirmed}
              label="확정"
              className="bg-info-bg text-info"
            />
            <StatTile
              value={data.reservationSummary.completed}
              label="완료"
              className="bg-success-bg text-success"
            />
          </div>
          {data.nextReservation && (
            <div className="bg-surface-muted flex flex-col gap-1.5 rounded-[10px] p-3">
              <div className="flex items-center gap-2">
                <span className="bg-info text-on-color rounded px-1.5 py-0.5 text-[9px] font-bold tracking-[0.54px]">
                  다음 확정
                </span>
                {data.nextReservation.dDayLabel && (
                  <span className="text-brand text-xs font-bold">
                    {data.nextReservation.dDayLabel}
                  </span>
                )}
              </div>
              <p className="text-fg text-[13px] font-semibold">
                {data.nextReservation.dateLabel}(
                {data.nextReservation.dayOfWeekLabel}){' '}
                {data.nextReservation.timeLabel} ·{' '}
                {data.nextReservation.locationTypeLabel}{' '}
                {data.nextReservation.locationDetailLabel}
              </p>
              <p className="text-fg-muted text-[11px]">
                예상 {data.nextReservation.expectedMinutes}분 · 요청자{' '}
                {data.nextReservation.requesterName}
              </p>
            </div>
          )}
          <Link
            to={`/mentor/mentoring-requests?teamId=${team.teamId}`}
            className="border-border text-fg-muted hover:bg-surface-muted mt-auto flex h-8 items-center justify-center gap-1 rounded-lg border text-xs font-semibold"
          >
            요청 처리
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        {/* 평가 · 추천 — N시간 완료/조기 종료 전 잠금 + 사유 표시 */}
        <section className={cn(CARD_SHELL, 'flex flex-col gap-3.5 p-5')}>
          <header className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Star className="text-fg h-4 w-4" />
              <h3 className="text-fg text-sm font-bold">평가 · 추천</h3>
            </div>
            {data.evaluation.locked && (
              <span className="bg-surface-muted text-fg-subtle flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                <XCircle className="h-[11px] w-[11px]" />
                {data.evaluation.lockReasonLabel}
              </span>
            )}
          </header>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-end justify-between gap-2">
              <span className="text-fg-subtle text-[11px]">
                N시간 완료 진행률
              </span>
              <span>
                <span className="text-brand text-sm font-bold">
                  {data.evaluation.progressHours}h
                </span>{' '}
                <span className="text-fg-subtle text-[11px]">
                  / {data.evaluation.allocatedHours}h ·{' '}
                  {data.evaluation.percent}%
                </span>
              </span>
            </div>
            <ProgressBar
              value={data.evaluation.progressHours}
              max={data.evaluation.allocatedHours}
              fillClass="bg-brand"
            />
          </div>
          <ul className="flex flex-col gap-2.5">
            <EvalItem
              icon={Star}
              title="평가 작성"
              description={`팀원 ${team.memberCount}명 평가 · N시간 완료 시 가능`}
              statusLabel={data.evaluation.evaluationStatusLabel}
            />
            <EvalItem
              icon={Flag}
              title="추천 선택"
              description="팀원 중 1명 또는 추천 안 함"
              statusLabel={data.evaluation.recommendationStatusLabel}
            />
          </ul>
        </section>
      </div>

      {/* 팀 최근 일지 */}
      <section className={CARD_SHELL}>
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="text-fg h-4 w-4" />
            <h3 className="text-fg text-[15px] font-bold">팀 최근 일지</h3>
            <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
              {data.recentLogs.length}건
            </span>
          </div>
          <Link
            to={`/mentor/mentoring-logs/new?teamId=${team.teamId}`}
            className={buttonClass({ size: 'sm' })}
          >
            <Check className="h-3 w-3" />새 일지 작성
          </Link>
        </header>
        <div className="px-6 pb-6">
          <DataTable
            columns={logColumns}
            rows={data.recentLogs}
            rowKey={(r) => r.logId}
            empty="작성된 일지가 없습니다"
          />
        </div>
      </section>
    </div>
  )
}

function Dot() {
  return (
    <span className="bg-fg-subtle h-[3px] w-[3px] rounded-full" aria-hidden />
  )
}

function HeaderKpi({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass: string
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-fg-subtle text-[10px] font-medium tracking-[0.8px]">
        {label}
      </span>
      <span className={cn('text-[22px] font-bold', valueClass)}>{value}</span>
    </div>
  )
}

function StatTile({
  value,
  label,
  className,
}: {
  value: number
  label: string
  className: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-0.5 rounded-lg p-2.5',
        className,
      )}
    >
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  )
}

function EvalItem({
  icon: Icon,
  title,
  description,
  statusLabel,
}: {
  icon: LucideIcon
  title: string
  description: string
  statusLabel: string
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="bg-surface-muted border-border text-fg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-fg text-xs font-semibold">{title}</span>
        <span className="text-fg-muted text-[11px]">{description}</span>
      </div>
      <StatusBadge label={statusLabel} />
    </li>
  )
}
