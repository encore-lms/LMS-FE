import { useState } from 'react'
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
import { hoursDoneLabel } from '../types'
import { Avatar } from '@/components/ui/Avatar'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { HeroBanner } from '@/components/data/HeroBanner'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { useMentorTeamDetail } from '../api/mentor'
import { useTeamEvaluation, useTeamRecommendation } from '../api/evaluations'
import { ProgressBar } from '../components/ProgressBar'
import EvaluationPage from '../evaluation/EvaluationPage'
import RecommendationPage from '../recommendation/RecommendationPage'
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
              <EvaluationPane teamId={teamId} />
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
  const goEvaluation = () => onTab('evaluation')
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

        <EvaluationCard data={data} onOpen={goEvaluation} />
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
            to={`/mentor/mentoring-logs/new?teamId=${team.teamId}&from=${encodeURIComponent(`/mentor/teams/${team.teamId}?tab=logs`)}`}
            className={buttonClass({ size: 'sm' })}
          >
            <Check className="h-3 w-3" />새 일지 작성
          </Link>
        </div>
      </section>
    </div>
  )
}

/**
 * 팀원 탭 — 이름만으로는 비어 보여, 이 팀에서 각자가 얼마나 함께했는지를 함께 둔다.
 *
 * <p>참석은 제출된 팀 일지 기준이다. 참석 기록이 생기기 전(2026-08-05) 일지는 누가 왔는지
 * 적힌 적이 없어 서버가 전원 참석으로 센다 — 그래서 옛 팀은 전부 100%로 보인다.</p>
 *
 * <p>담당 파트 칩은 두지 않는다 — tagLabel 이 파트가 아니라 역할('PM'·'팀원')을 담고 있어
 * 옆의 역할 배지와 같은 글자가 두 번 나온다.</p>
 */
function MembersPane({ data }: { data: Detail }) {
  const total = data.members[0]?.sessionCount ?? 0
  return (
    <section className={cn(CARD_SHELL, 'flex flex-col')}>
      <header className="flex items-center gap-2 px-5 py-4">
        <h3 className="text-fg text-sm font-bold">팀원</h3>
        <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
          {data.members.length}명
        </span>
        {total > 0 && (
          <span className="text-fg-subtle ml-auto text-[11px]">
            총 {total}회 진행
          </span>
        )}
      </header>
      <ul className="divide-divider divide-y">
        {data.members.map((member) => (
          <li key={member.studentId}>
            <Link
              to={`/mentor/mentees/${member.studentId}`}
              className="hover:bg-surface-muted flex flex-col gap-2 px-5 py-3"
            >
              <div className="flex items-center gap-3">
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
                <span className="ml-auto flex items-center gap-3">
                  <AttendanceLabel member={member} />
                  <ChevronRight className="text-fg-subtle h-3 w-3" />
                </span>
              </div>
              <AttendanceBar member={member} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** 참석 수치 — 아직 한 회차도 진행하지 않았으면 셀 것이 없다. */
function AttendanceLabel({ member }: { member: Detail['members'][number] }) {
  const total = member.sessionCount ?? 0
  if (total === 0) {
    return <span className="text-fg-subtle text-[11px]">진행한 회차 없음</span>
  }
  return (
    <>
      <span className="text-fg text-[11px] font-bold">
        {member.attendedCount ?? 0}
        <span className="text-fg-subtle font-medium">/{total}회</span>
      </span>
      {member.lastAttendedLabel && (
        <span className="text-fg-subtle text-[11px] whitespace-nowrap">
          최근 {member.lastAttendedLabel}
        </span>
      )}
    </>
  )
}

// 참석률 막대 — 이름줄 아래로 아바타 폭만큼 들여 써 누구의 것인지 이어 보인다.
function AttendanceBar({ member }: { member: Detail['members'][number] }) {
  const total = member.sessionCount ?? 0
  if (total === 0) return null
  const pct = Math.round(((member.attendedCount ?? 0) / total) * 100)
  return (
    <div className="flex items-center gap-2 pl-11">
      <div
        className="bg-surface-muted h-1.5 flex-1 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${member.name} 참석률`}
      >
        <div
          className={cn(
            'h-full rounded-full',
            pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-brand' : 'bg-warning',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-fg-subtle w-9 text-right text-[10px]">{pct}%</span>
    </div>
  )
}

function EvaluationPane({ teamId }: { teamId: string }) {
  const evaluation = useTeamEvaluation(teamId)
  const recommendation = useTeamRecommendation(teamId)
  // 제출을 마친 직후 서버 상태를 다시 읽기 전까지 잠깐 어긋나는 것을 막는다.
  const [justSubmitted, setJustSubmitted] = useState<'eval' | 'rec' | null>(
    null,
  )
  // 다시 열어 고치는 중 — 자동 판정(완료·추천)으로 튕기지 않게 붙잡아 둔다.
  const [reopen, setReopen] = useState<'eval' | 'rec' | null>(null)

  const evalDone =
    justSubmitted !== null || evaluation.data?.status === 'submitted'
  const recDone =
    justSubmitted === 'rec' ||
    (recommendation.data?.status?.startsWith('submitted') ?? false)

  if (evaluation.isPending || recommendation.isPending) {
    return <SkeletonListPage kpis={3} columns={4} className="" />
  }

  const step =
    reopen ?? (evalDone && recDone ? 'done' : evalDone ? 'rec' : 'eval')

  if (step === 'done') {
    return (
      <DonePane
        onEditEvaluation={() => {
          setJustSubmitted(null)
          setReopen('eval')
        }}
        onEditRecommendation={() => setReopen('rec')}
      />
    )
  }

  if (step === 'rec') {
    return (
      <RecommendationPage
        teamId={teamId}
        onSubmitted={() => {
          setReopen(null)
          setJustSubmitted('rec')
        }}
        onBack={() => setReopen('eval')}
      />
    )
  }

  return (
    <EvaluationPage
      teamId={teamId}
      onSubmitted={() => {
        // 평가를 냈으니 다음은 추천이다 — 붙잡아 둔 단계를 놓아 자동 판정에 맡긴다.
        setReopen(null)
        setJustSubmitted('eval')
      }}
    />
  )
}

// 둘 다 끝났을 때 — 더 할 일이 없다는 것을 말해 주고, 고치고 싶으면 그 자리에서 연다.
function DonePane({
  onEditEvaluation,
  onEditRecommendation,
}: {
  onEditEvaluation: () => void
  onEditRecommendation: () => void
}) {
  return (
    <section
      className={cn(CARD_SHELL, 'flex flex-col items-center gap-3 px-6 py-12')}
    >
      <span className="bg-success-bg text-success flex size-12 items-center justify-center rounded-full">
        <Check className="size-6" />
      </span>
      <h3 className="text-fg text-lg font-bold">평가와 추천을 모두 마쳤어요</h3>
      <p className="text-fg-muted text-[13px]">
        이 팀에 남은 일이 없습니다. 내용을 고치려면 아래에서 다시 열 수 있어요.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onEditEvaluation}
          className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3.5 py-2 text-xs font-semibold"
        >
          평가 수정
        </button>
        <button
          type="button"
          onClick={onEditRecommendation}
          className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3.5 py-2 text-xs font-semibold"
        >
          추천 수정
        </button>
      </div>
    </section>
  )
}

// 평가 · 추천 — 상시 작성·재제출 가능(2026-08-04 완화). 진행률은 정보로만 남긴다.
function EvaluationCard({
  data,
  onOpen,
}: {
  data: Detail
  /** 평가·추천 탭으로 — 홈 카드에서만 준다(탭 안에서는 이미 그 자리다). */
  onOpen?: () => void
}) {
  const team = data.assignment
  return (
    <section className={cn(CARD_SHELL, 'flex flex-col gap-3.5 p-5')}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Star className="text-fg h-4 w-4" />
          <h3 className="text-fg text-sm font-bold">평가 · 추천</h3>
        </div>
        {onOpen && <TabLink label="평가·추천 전체" onClick={onOpen} />}
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
            {hoursDoneLabel(data.evaluation.allocatedHours)} 진행률
          </span>
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
          onClick={onOpen}
        />
        <EvalItem
          icon={Flag}
          title="추천 선택"
          description="팀원 중 1명 또는 추천 안 함 · 평가와 독립"
          statusLabel={data.evaluation.recommendationStatusLabel}
          onClick={onOpen}
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

// 행 전체가 평가·추천 탭으로 가는 버튼 — 평가·추천은 탭 안에서 순서대로 하고,
// 단독 작성 화면은 걷어냈다(2026-08-04). 주소로 나가면 '찾을 수 없는 주소'가 된다.
function EvalItem({
  icon: Icon,
  title,
  description,
  statusLabel,
  onClick,
}: {
  icon: LucideIcon
  title: string
  description: string
  statusLabel: string
  onClick?: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="hover:bg-surface-muted -m-1 flex w-full items-center gap-3 rounded-lg p-1 text-left"
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
      </button>
    </li>
  )
}
