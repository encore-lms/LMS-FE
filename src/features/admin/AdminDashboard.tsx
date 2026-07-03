import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  BadgeCheck,
  Bell,
  BookMarked,
  Check,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Inbox,
  PenSquare,
  RefreshCw,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Empty } from '@/components/ui/Empty'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useAdminDashboard } from './api/dashboard'
import { useCountUp } from './dashboard/useCountUp'
import { Sparkline } from './dashboard/Sparkline'

// 분석 모달(chart.js ~72kB)은 열릴 때만 로드 — 대시보드 초기 로드를 가볍게 유지.
const AttendanceAnalyticsModal = lazy(() =>
  import('./dashboard/AttendanceAnalyticsModal').then((m) => ({
    default: m.AttendanceAnalyticsModal,
  })),
)
import type {
  AdminOperatorDashboard,
  DashboardCohort,
  RepeatedIssue,
} from './dashboard/types'

/**
 * 운영 대시보드 (/admin) — 이전 LMS 매니저 대시보드 IA를 현재 디자인 시스템으로 포팅.
 * Hero → 핵심지표(다크카드+스파크라인) → 오늘 미출석 → 연속 지각·결석 → 처리 대기 → 일정.
 * 출석 지표는 HRD-Net 키가 있을 때만 채워지고, 없으면 우아하게 degrade한다.
 */
export default function AdminDashboard() {
  usePageHeader('대시보드', '오늘 처리할 운영 이슈를 한눈에')
  const { data, isPending, isError, refetch, isFetching } = useAdminDashboard()

  if (isPending) return <DashboardSkeleton />
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="대시보드를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }
  return (
    <DashboardView
      data={data}
      onRefresh={() => refetch()}
      refreshing={isFetching}
    />
  )
}

function DashboardView({
  data,
  onRefresh,
  refreshing,
}: {
  data: AdminOperatorDashboard
  onRefresh: () => void
  refreshing: boolean
}) {
  const { cohorts, repeatedIssues, pending, upcoming } = data

  const totalStudents = cohorts.reduce((s, c) => s + (c.totalStudents ?? 0), 0)
  const checkedIn = cohorts.reduce((s, c) => s + (c.checkedInToday ?? 0), 0)
  const hasAttendance = data.hrdAvailable && totalStudents > 0
  const attendanceRate = hasAttendance
    ? Math.round((checkedIn / totalStudents) * 100)
    : null
  const todayAbsent = cohorts.reduce((s, c) => s + c.absentToday.length, 0)
  const pendingCount = pending.recordsTotal + pending.mileage
  const riskCount = repeatedIssues.length
  const trend = useMemo(
    () => buildTrend(cohorts, attendanceRate),
    [cohorts, attendanceRate],
  )
  const [analyticsOpen, setAnalyticsOpen] = useState(false)

  const scrollTo = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* 헤더 행 — 오늘 날짜 + 새로고침 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-fg-muted text-[13px]">
          오늘 · <span className="text-fg font-semibold">{data.today}</span>
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
          {refreshing ? '불러오는 중…' : '새로고침'}
        </button>
      </div>

      {cohorts.length > 0 && !data.hrdAvailable && (
        <div className="border-warning/40 bg-warning-bg/60 text-fg flex items-start gap-2 rounded-xl border p-3.5 text-[12px] leading-5">
          <TriangleAlert className="text-warning mt-0.5 size-4 shrink-0" />
          <span>
            HRD-Net 인증키가 등록되어 있지 않아 실제 입실 기록을 조회할 수
            없습니다.{' '}
            <span className="text-fg-muted">
              설정 &gt; API 설정에서 키를 등록하면 오늘 미출석·출석률이 자동
              표시됩니다.
            </span>
          </span>
        </div>
      )}

      {/* 핵심 지표 — 다크 히어로 카드 */}
      <HeroMetrics
        attendanceRate={attendanceRate}
        trend={trend}
        riskCount={riskCount}
        todayAbsent={todayAbsent}
        pendingCount={pendingCount}
        cohortCount={cohorts.length}
        onRiskClick={() => scrollTo('repeated-absence')}
        onPendingClick={() => scrollTo('pending-actions')}
        onAttendanceClick={() => setAnalyticsOpen(true)}
      />

      <AbsenteeCard cohorts={cohorts} />

      <RepeatedAbsenceCard issues={repeatedIssues} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <PendingActions pending={pending} />
        <ScheduleCard upcoming={upcoming} />
      </div>

      {analyticsOpen && (
        <Suspense fallback={null}>
          <AttendanceAnalyticsModal
            open
            onClose={() => setAnalyticsOpen(false)}
          />
        </Suspense>
      )}
    </div>
  )
}

/* ─────────────────────────── 핵심 지표(다크 히어로) ─────────────────────────── */

function HeroMetrics({
  attendanceRate,
  trend,
  riskCount,
  todayAbsent,
  pendingCount,
  cohortCount,
  onRiskClick,
  onPendingClick,
  onAttendanceClick,
}: {
  attendanceRate: number | null
  trend: number[]
  riskCount: number
  todayAbsent: number
  pendingCount: number
  cohortCount: number
  onRiskClick: () => void
  onPendingClick: () => void
  onAttendanceClick: () => void
}) {
  return (
    <section className="bg-brand-deep text-on-color relative overflow-hidden rounded-2xl p-6 shadow-[0_18px_48px_-24px_rgba(18,23,38,0.6)]">
      <div className="bg-brand/20 pointer-events-none absolute -top-24 -right-16 size-64 rounded-full blur-3xl" />
      <div className="text-on-color/70 relative flex items-center gap-2 text-[12px] font-semibold">
        <Bell className="size-3.5 text-amber-300" />
        오늘 인사이트
      </div>
      <div className="relative mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="오늘 출석률"
          value={attendanceRate == null ? '—' : attendanceRate}
          suffix={attendanceRate == null ? '' : '%'}
          onClick={onAttendanceClick}
          footer={
            trend.length >= 2 ? (
              <Sparkline
                points={trend}
                stroke="var(--color-success)"
                todayIndex={trend.length - 1}
              />
            ) : (
              <span className="text-on-color/45 text-[11px]">
                HRD 키 등록 시 표시
              </span>
            )
          }
        />
        <MetricTile
          label="위험군"
          value={riskCount}
          suffix="명"
          onClick={onRiskClick}
          hint="연속 지각·결석"
        />
        <MetricTile label="오늘 미출석" value={todayAbsent} suffix="명" />
        <MetricTile
          label="처리 대기"
          value={pendingCount}
          suffix="건"
          onClick={onPendingClick}
          hint={`활성 기수 ${cohortCount}개`}
        />
      </div>
    </section>
  )
}

function MetricTile({
  label,
  value,
  suffix,
  footer,
  onClick,
  hint,
}: {
  label: string
  value: number | string
  suffix?: string
  footer?: ReactNode
  onClick?: () => void
  hint?: string
}) {
  const numeric = typeof value === 'number'
  const shown = useCountUp(numeric ? (value as number) : 0)
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'bg-surface/[0.06] flex min-h-[7rem] flex-col justify-between rounded-2xl border border-white/10 p-4 text-left transition-colors',
        onClick && 'hover:bg-surface/[0.12] cursor-pointer',
      )}
    >
      <span className="text-on-color/60 text-[12px] font-medium">{label}</span>
      <div>
        <span className="text-[28px] leading-none font-extrabold tabular-nums">
          {numeric ? shown : value}
        </span>
        {suffix && (
          <span className="text-on-color/70 ml-0.5 text-[14px] font-bold">
            {suffix}
          </span>
        )}
      </div>
      <div className="min-h-[16px]">
        {footer ??
          (hint && (
            <span className="text-on-color/45 text-[11px]">{hint}</span>
          ))}
      </div>
    </Tag>
  )
}

/* ─────────────────────────── 오늘 미출석 ─────────────────────────── */

const DISCORD_MSG = (names: string[], cohortName: string) =>
  `${names.join(', ')}\n\n안녕하세요, ${cohortName} 매니저입니다.\n오늘 입실(출석) 인증이 아직 확인되지 않았습니다. 확인 후 출결 폼을 제출해 주세요. 이미 인증하셨다면 이 메시지는 무시하셔도 됩니다.`

function AbsenteeCard({ cohorts }: { cohorts: DashboardCohort[] }) {
  const toast = useToast()
  const [copied, setCopied] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const withAbsentees = cohorts
    .filter((c) => c.absentToday.length > 0)
    .sort((a, b) => b.absentToday.length - a.absentToday.length)

  const copy = (key: string, text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(key)
        toast.success(`${label} 복사됨`)
        window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600)
      },
      () => toast.danger('복사에 실패했어요'),
    )
  }

  return (
    <Section
      icon={<Bell className="size-4" />}
      title="오늘 미출석 체크"
      subtitle="오전 9시 기준 · 기수별 미출석자에게 메시지를 보내세요"
    >
      {withAbsentees.length === 0 ? (
        <div className="bg-success-bg text-success flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold">
          <Check className="size-4" />
          오늘 모든 기수 출석 인증 완료
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {withAbsentees.map((c) => {
            const names = c.absentToday.map((a) => a.name)
            const open = expanded.has(c.cohortId)
            const shown = open ? names : names.slice(0, 5)
            return (
              <div
                key={c.cohortId}
                className="bg-surface-muted flex flex-col gap-3 rounded-xl p-4 md:flex-row md:items-start md:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-fg text-[14px] font-bold">
                      {c.name}
                    </span>
                    <StatusBadge tone="warning" label={`${names.length}명`} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {shown.map((n, i) => (
                      <span
                        key={`${n}-${i}`}
                        className="bg-surface text-fg rounded-md px-2 py-1 text-[12px]"
                      >
                        {n}
                      </span>
                    ))}
                    {names.length > 5 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => {
                            const next = new Set(prev)
                            if (next.has(c.cohortId)) next.delete(c.cohortId)
                            else next.add(c.cohortId)
                            return next
                          })
                        }
                        className="border-border text-fg-muted rounded-md border border-dashed px-2 py-1 text-[12px]"
                      >
                        {open ? '접기' : `+${names.length - 5}명 더`}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copy(`${c.cohortId}-names`, names.join(', '), '인원')
                    }
                    className="border-border text-fg-muted hover:bg-surface flex items-center gap-1 rounded-lg border px-3 py-2 text-[12px] font-semibold"
                  >
                    <Users className="size-3.5" />
                    인원 복사
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copy(
                        `${c.cohortId}-msg`,
                        DISCORD_MSG(names, c.name),
                        '메시지',
                      )
                    }
                    className={cn(
                      'text-on-color flex items-center gap-1 rounded-lg px-3 py-2 text-[12px] font-bold transition-colors',
                      copied === `${c.cohortId}-msg`
                        ? 'bg-success'
                        : 'bg-brand-deep',
                    )}
                  >
                    {copied === `${c.cohortId}-msg` ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied === `${c.cohortId}-msg` ? '복사됨' : '메시지 복사'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Section>
  )
}

/* ─────────────────────────── 연속 지각·결석 ─────────────────────────── */

function severityTone(total: number): 'danger' | 'warning' | 'info' {
  return total >= 4 ? 'danger' : total >= 3 ? 'warning' : 'info'
}
function severityLabel(total: number): string {
  return total >= 4 ? '긴급' : total >= 3 ? '주의' : '관찰'
}

function RepeatedAbsenceCard({ issues }: { issues: RepeatedIssue[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, RepeatedIssue[]>()
    for (const it of issues) {
      const arr = map.get(it.cohortName) ?? []
      arr.push(it)
      map.set(it.cohortName, arr)
    }
    return [...map.entries()]
  }, [issues])

  return (
    <section id="repeated-absence" className="scroll-mt-6">
      <Section
        icon={<TriangleAlert className="size-4" />}
        title="연속 지각·결석 감지"
        subtitle="최근 출결 신고 누적 · 총 2회 이상"
      >
        {issues.length === 0 ? (
          <div className="bg-success-bg text-success flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold">
            <Check className="size-4" />
            반복 이상 출결 학생이 없습니다
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map(([cohortName, list]) => (
              <div key={cohortName} className="flex flex-col gap-2">
                <div className="text-fg-muted flex items-center gap-1.5 text-[12px] font-semibold">
                  {cohortName}
                  <span className="text-fg-subtle">· {list.length}명</span>
                </div>
                <div className="flex flex-col gap-2">
                  {list.map((it, i) => {
                    const total = it.lateCount + it.absenceCount
                    const name = it.name?.trim() || '수강생'
                    return (
                      <div
                        key={`${it.studentId}-${i}`}
                        className="border-border bg-surface flex items-center justify-between gap-3 rounded-xl border p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex size-9 items-center justify-center rounded-full text-[13px] font-bold',
                              total >= 4
                                ? 'bg-danger-bg text-danger'
                                : total >= 3
                                  ? 'bg-warning-bg text-warning'
                                  : 'bg-accent-bg text-accent-strong',
                            )}
                          >
                            {name.slice(-2)}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-fg text-[14px] font-semibold">
                              {name}
                            </span>
                            <StatusBadge
                              tone={severityTone(total)}
                              label={severityLabel(total)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[12px]">
                          <span className="text-warning flex items-center gap-1 font-semibold">
                            <Clock className="size-3.5" />
                            지각 {it.lateCount}
                          </span>
                          <span className="text-danger flex items-center gap-1 font-semibold">
                            <TriangleAlert className="size-3.5" />
                            결석 {it.absenceCount}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </section>
  )
}

/* ─────────────────────────── 처리 대기 ─────────────────────────── */

function PendingActions({
  pending,
}: {
  pending: AdminOperatorDashboard['pending']
}) {
  const navigate = useNavigate()
  const items = [
    {
      key: 'mileage',
      label: '마일리지 구매 요청',
      count: pending.mileage,
      icon: <Coins className="size-4" />,
      to: '/admin/mileage/purchase-requests',
    },
    {
      key: 'blog',
      label: '블로그 승인 대기',
      count: pending.blog,
      icon: <PenSquare className="size-4" />,
      to: '/admin/records/review?category=블로그',
    },
    {
      key: 'study',
      label: '스터디 승인 대기',
      count: pending.study,
      icon: <BookMarked className="size-4" />,
      to: '/admin/records/review?category=스터디',
    },
    {
      key: 'certificate',
      label: '자격증 승인 대기',
      count: pending.certificate,
      icon: <BadgeCheck className="size-4" />,
      to: '/admin/records/review?category=자격증',
    },
  ]
  const total = items.reduce((s, it) => s + it.count, 0)

  return (
    <section id="pending-actions" className="scroll-mt-6">
      <Section icon={<Inbox className="size-4" />} title="처리 대기">
        {total === 0 ? (
          <div className="bg-success-bg text-success flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold">
            <Check className="size-4" />
            처리 대기 항목이 없습니다
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {items.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => navigate(it.to)}
                disabled={it.count === 0}
                className={cn(
                  'border-border bg-surface flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors',
                  it.count > 0
                    ? 'hover:border-brand/40 cursor-pointer'
                    : 'opacity-50',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className="bg-surface-muted text-fg-muted flex size-9 items-center justify-center rounded-lg">
                    {it.icon}
                  </span>
                  <span className="text-fg text-[13px] font-semibold">
                    {it.label}
                  </span>
                </span>
                <span className="text-fg flex items-center gap-1 text-[15px] font-bold tabular-nums">
                  {it.count}
                  <span className="text-fg-subtle text-[12px] font-medium">
                    건
                  </span>
                  <ChevronRight className="text-fg-subtle size-4" />
                </span>
              </button>
            ))}
          </div>
        )}
      </Section>
    </section>
  )
}

/* ─────────────────────────── 일정 ─────────────────────────── */

function dday(dateIso: string): { label: string; urgent: boolean } {
  const target = new Date(dateIso)
  const now = new Date()
  const days = Math.ceil((target.getTime() - now.getTime()) / 86400000)
  if (days === 0) return { label: 'D-Day', urgent: true }
  if (days < 0) return { label: `D+${-days}`, urgent: false }
  return { label: `D-${days}`, urgent: days <= 1 }
}

function ScheduleCard({
  upcoming,
}: {
  upcoming: AdminOperatorDashboard['upcoming']
}) {
  return (
    <Section icon={<Award className="size-4" />} title="일정">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-fg-subtle text-[12px] font-semibold">
            퀴즈 일정
          </span>
          {upcoming.quizzes.length === 0 ? (
            <p className="text-fg-subtle py-2 text-[12px]">
              예정된 퀴즈가 없습니다.
            </p>
          ) : (
            upcoming.quizzes.map((q) => {
              const d = dday(q.endAt)
              return (
                <div
                  key={q.id}
                  className="hover:bg-surface-muted flex items-center justify-between gap-2 rounded-lg px-2 py-2"
                >
                  <span className="text-fg min-w-0 truncate text-[13px]">
                    <span className="text-fg-subtle">[{q.cohortName}]</span>{' '}
                    {q.title}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-[12px] font-bold',
                      d.urgent ? 'text-danger' : 'text-fg-muted',
                    )}
                  >
                    {d.label}
                  </span>
                </div>
              )
            })
          )}
        </div>
        <div className="border-divider flex flex-col gap-1.5 border-t pt-3">
          <span className="text-fg-subtle text-[12px] font-semibold">
            기수 종료 예정
          </span>
          {upcoming.cohortEndings.length === 0 ? (
            <p className="text-fg-subtle py-2 text-[12px]">
              기수 종료 일정이 없습니다.
            </p>
          ) : (
            upcoming.cohortEndings.map((c) => {
              const urgent = c.daysLeft >= 0 && c.daysLeft <= 30
              return (
                <div
                  key={c.cohortId}
                  className="hover:bg-surface-muted flex items-center justify-between gap-2 rounded-lg px-2 py-2"
                >
                  <span className="text-fg min-w-0 truncate text-[13px]">
                    {c.name}{' '}
                    <span className="text-fg-subtle">({c.endDate})</span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-[12px] font-bold',
                      urgent ? 'text-danger' : 'text-fg-muted',
                    )}
                  >
                    D-{c.daysLeft}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Section>
  )
}

/* ─────────────────────────── 공통 ─────────────────────────── */

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="border-border bg-surface rounded-xl border p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-fg flex items-center gap-1.5 text-[16px] font-bold">
          {icon && <span className="text-fg-muted">{icon}</span>}
          {title}
        </h2>
        {subtitle && (
          <span className="text-fg-subtle text-[12px]">{subtitle}</span>
        )}
      </div>
      {children}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5 p-8">
      <div className="bg-surface-muted h-8 w-40 rounded-lg" />
      <div className="bg-surface-muted h-40 rounded-2xl" />
      <div className="bg-surface-muted h-32 rounded-xl" />
      <div className="bg-surface-muted h-32 rounded-xl" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-surface-muted h-40 rounded-xl" />
        <div className="bg-surface-muted h-40 rounded-xl" />
      </div>
    </div>
  )
}

function buildTrend(
  cohorts: DashboardCohort[],
  todayRate: number | null,
): number[] {
  const series = cohorts
    .map((c) => c.weeklyAttendanceRate)
    .filter((a) => a.length > 0)
  if (series.length === 0) return []
  const len = Math.max(...series.map((a) => a.length))
  const avg: number[] = []
  for (let i = 0; i < len; i++) {
    const vals = series
      .map((a) => a[i])
      .filter((v): v is number => typeof v === 'number')
    if (vals.length)
      avg.push(Math.round(vals.reduce((s, v) => s + v, 0) / vals.length))
  }
  if (typeof todayRate === 'number') avg.push(todayRate)
  return avg
}
