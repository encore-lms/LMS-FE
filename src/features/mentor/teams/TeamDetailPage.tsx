import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  Star,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { HeroBanner } from '@/components/data/HeroBanner'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useMentorTeamDetail } from '../api/mentor'
import { ProgressBar } from '../components/ProgressBar'
import RequestsPage from '../requests/RequestsPage'
import LogsPage from '../mentoring-logs/LogsPage'

const CARD_SHELL =
  'bg-surface rounded-2xl shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]'

type TabKey = 'home' | 'members' | 'requests' | 'logs' | 'evaluation'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: '홈' },
  { key: 'members', label: '팀원' },
  { key: 'requests', label: '예약' },
  { key: 'logs', label: '일지' },
  { key: 'evaluation', label: '평가·추천' },
]

type Detail = NonNullable<ReturnType<typeof useMentorTeamDetail>['data']>

/**
 * 팀 상세 (/mentor/teams/:teamId) — 운영 과정 상세(/admin/education/:cohortId)와 같은 골격.
 *
 * <p>예전에는 예약·일지·평가를 사이드바에서 따로 열고, 거기서 다시 팀을 골라야 했다. 멘토가
 * 하는 일은 늘 '어느 팀의' 무엇이라 팀 안으로 들여왔다. 사이드바에는 대시보드와 배정 팀
 * 목록만 남는다(경로는 그대로라 기존 링크·딥링크는 계속 열린다).</p>
 */
export default function TeamDetailPage() {
  const { teamId = '' } = useParams()
  const { data, isPending, isError, refetch } = useMentorTeamDetail(teamId)
  const team = data?.assignment

  usePageHeader(
    team ? team.teamName : '팀 상세',
    team
      ? `${team.cohortLabel} · ${data?.periodLabel ?? ''} · 배정 팀의 멘토링을 한 곳에서 관리합니다`
      : '배정 팀의 멘토링을 한 곳에서 관리합니다',
  )

  const [tabParam, setTab] = useSearchParamState('tab', 'home')
  const tab = tabParam as TabKey

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="팀 정보를 불러오는 중…"
      errorTitle="팀 정보를 불러오지 못했어요"
      errorDescription="본인에게 배정된 팀만 열람할 수 있어요."
      className="p-8"
    >
      {data && (
        <div className="p-8">
          <Link
            to="/mentor/teams"
            className="text-fg-muted hover:text-fg inline-flex items-center gap-1 text-[13px] font-medium"
          >
            <ChevronLeft className="h-4 w-4" /> 내 배정 팀
          </Link>

          <Tabs
            variant="underline"
            aria-label="팀 관리 탭"
            value={tab}
            onChange={setTab}
            items={TABS.map((t) => ({ value: t.key, label: t.label }))}
            className="mt-5"
          />

          <div className="mt-6">
            {tab === 'members' ? (
              <MembersPane data={data} />
            ) : tab === 'requests' ? (
              // 사이드바 '멘토링 예약' 흡수 — 이 팀 요청만.
              <RequestsPage embedded teamId={teamId} />
            ) : tab === 'logs' ? (
              // 사이드바 '멘토링 일지' 흡수 — 팀이 정해졌으니 팀 고르는 칸은 없다.
              <LogsPage embedded teamId={teamId} />
            ) : tab === 'evaluation' ? (
              <EvaluationPane data={data} />
            ) : (
              <HomePane data={data} onTab={setTab} />
            )}
          </div>
        </div>
      )}
    </DataBoundary>
  )
}

// 홈 — 지금 이 팀이 어디까지 왔는지 한 눈에. 깊이 볼 것은 각 탭에 있다.
function HomePane({
  data,
  onTab,
}: {
  data: Detail
  onTab: (next: string) => void
}) {
  const team = data.assignment
  const pct =
    team.allocatedHours > 0
      ? Math.round((team.recognizedHours / team.allocatedHours) * 100)
      : 0

  return (
    <div className="flex flex-col gap-5">
      <HeroBanner
        eyebrow="MENTORING TEAM"
        title={`${team.teamName} · ${team.cohortLabel}`}
        meta={[
          data.periodLabel,
          `팀원 ${team.memberCount}명`,
          `담당 멘토 ${data.mentorName}`,
        ]}
        badgeLabel="인정률"
        badgeValue={`${pct}%`}
        progressPct={pct}
        progressLabel={`인정 ${team.recognizedHours}h / 배정 ${team.allocatedHours}h`}
        progressSubLabel={`잔여 인정 ${team.remainingHours}h`}
      />

      {/* 예약 · 평가·추천 요약 — 자세한 것은 각 탭에서 */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <section className={cn(CARD_SHELL, 'flex flex-col gap-3.5 p-5')}>
          <header className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="text-fg h-4 w-4" />
              <h3 className="text-fg text-sm font-bold">예약</h3>
            </div>
            <TabLink label="예약 전체" onClick={() => onTab('requests')} />
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
        </section>

        <EvaluationCard data={data} />
      </div>

      {/* 최근 일지 — 몇 건인지와 바로 쓰기. 목록은 일지 탭에 */}
      <section
        className={cn(CARD_SHELL, 'flex flex-wrap items-center gap-3 p-5')}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-sm font-bold">
            팀 일지 {data.recentLogs.length}건
          </span>
          <span className="text-fg-muted text-[11px]">
            작성한 일지는 ‘일지’ 탭에서 모두 볼 수 있어요
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <TabLink label="일지 전체" onClick={() => onTab('logs')} />
          <Link
            to={`/mentor/mentoring-logs/new?teamId=${team.teamId}`}
            className={buttonClass({ size: 'sm' })}
          >
            <Check className="h-3 w-3" />새 일지 작성
          </Link>
        </div>
      </section>
    </div>
  )
}

function MembersPane({ data }: { data: Detail }) {
  return (
    <section className={cn(CARD_SHELL, 'flex flex-col')}>
      <header className="flex items-center gap-2 px-5 py-4">
        <h3 className="text-fg text-sm font-bold">팀원</h3>
        <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
          {data.members.length}명
        </span>
      </header>
      <ul className="divide-divider divide-y">
        {data.members.map((member) => (
          <li key={member.studentId}>
            <Link
              to={`/mentor/mentees/${member.studentId}`}
              className="hover:bg-surface-muted flex items-center gap-3 px-5 py-3"
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
  )
}

function EvaluationPane({ data }: { data: Detail }) {
  return (
    <div className="lg:max-w-[560px]">
      <EvaluationCard data={data} />
    </div>
  )
}

// 평가 · 추천 — 상시 작성·재제출 가능(2026-08-04 완화). 진행률은 정보로만 남긴다.
function EvaluationCard({ data }: { data: Detail }) {
  const team = data.assignment
  return (
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
          <span className="text-fg-subtle text-[11px]">N시간 완료 진행률</span>
          <span>
            <span className="text-brand text-sm font-bold">
              {data.evaluation.progressHours}h
            </span>{' '}
            <span className="text-fg-subtle text-[11px]">
              / {data.evaluation.allocatedHours}h · {data.evaluation.percent}%
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
          description={`팀원 ${team.memberCount}명 평가 · 상시 작성·재제출 가능`}
          statusLabel={data.evaluation.evaluationStatusLabel}
          to={`/mentor/teams/${team.teamId}/evaluation`}
        />
        <EvalItem
          icon={Flag}
          title="추천 선택"
          description="팀원 중 1명 또는 추천 안 함 · 평가와 독립"
          statusLabel={data.evaluation.recommendationStatusLabel}
          to={`/mentor/teams/${team.teamId}/recommendation`}
        />
      </ul>
    </section>
  )
}

// 같은 화면 안 탭으로 보내는 링크 — 주소가 아니라 탭이라 button 이다.
function TabLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-fg-muted hover:text-fg inline-flex items-center gap-1 text-[11px] font-semibold"
    >
      {label}
      <ArrowRight className="h-3 w-3" />
    </button>
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

// 상시 작성 정책(2026-08-04) — 행 전체를 작성 화면으로 연결해 팀 상세에서 바로 진입한다.
function EvalItem({
  icon: Icon,
  title,
  description,
  statusLabel,
  to,
}: {
  icon: LucideIcon
  title: string
  description: string
  statusLabel: string
  to: string
}) {
  return (
    <li>
      <Link
        to={to}
        className="hover:bg-surface-muted -m-1 flex items-center gap-3 rounded-lg p-1"
      >
        <span className="bg-surface-muted border-border text-fg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-fg text-xs font-semibold">{title}</span>
          <span className="text-fg-muted text-[11px]">{description}</span>
        </div>
        <StatusBadge label={statusLabel} />
        <ArrowRight className="text-fg-subtle h-3 w-3 shrink-0" />
      </Link>
    </li>
  )
}
