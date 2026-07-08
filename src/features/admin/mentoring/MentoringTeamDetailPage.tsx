import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ClockAlert,
  FileText,
  UserPlus,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { useMentoringTeamDetail, useMentorAssignments } from './api'
import {
  ASSIGNMENT_STATUS_META,
  LOG_STATUS_META,
  progressFillClass,
  type AssignmentDisplayStatus,
} from './statusMeta'
import { AssignmentManageModal } from './AssignmentManageModal'
import { AddMenteesModal } from './AddMenteesModal'
import { EarlyEndModal } from './EarlyEndModal'
import { LogReviewModal } from './LogReviewModal'
import type { AdminTeamLogBrief, MentorAssignmentRow } from './types'

// 멘토링 팀 상세 (/admin/mentoring/teams/:teamId) — 카드 클릭 진입.
// 개요 + 할 일·경고 스트립 + 누적 인정시간 추이 + 일지 상태 도넛 + 일지 타임라인 + 멘티 명단.

/** 일지 상태별 색 — LOG_STATUS_META 톤과 동일 계열의 차트 팔레트 토큰. */
const LOG_COLOR: Record<string, string> = {
  valid: 'var(--color-chart-positive)',
  resubmitted_valid: 'var(--color-chart-accent)',
  change_requested: 'var(--color-chart-info)',
  draft: 'var(--color-chart-neutral)',
}
function logColorOf(status: string, resubmitted: boolean) {
  if (status === 'valid')
    return resubmitted ? LOG_COLOR.resubmitted_valid : LOG_COLOR.valid
  return LOG_COLOR[status] ?? LOG_COLOR.draft
}

/** 회차별 인정 시간 막대 차트 — 회차마다 인정 시간, 상태별 색. 2건 이상이면 평균선. */
function RoundHoursBarChart({ logs }: { logs: AdminTeamLogBrief[] }) {
  const asc = [...logs].reverse() // BE desc → 회차순
  const bars = asc.map((l) => ({
    label: l.roundLabel,
    value: l.recognizedHours ?? 0,
    color: logColorOf(l.status, l.resubmitted),
  }))
  const vals = bars.map((b) => b.value)
  const avg =
    vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
  // 상단 여백을 넉넉히 둬 막대가 꽉 차 보이지 않게(비율 완화).
  const maxY = Math.max(...vals, avg, 1) * 1.35
  const W = 640
  const H = 132
  const padL = 12
  const padR = 12
  const padT = 16
  const padB = 24
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const baseY = padT + innerH
  const slot = innerW / bars.length
  const barW = Math.min(44, slot * 0.4)
  const avgY = baseY - (avg / maxY) * innerH

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="회차별 인정 시간"
    >
      {/* 기준선 */}
      <line
        x1={padL}
        y1={baseY}
        x2={W - padR}
        y2={baseY}
        stroke="var(--color-border)"
        strokeWidth="1"
      />
      {/* 평균선 (2건 이상) */}
      {bars.length >= 2 && avg > 0 && (
        <>
          <line
            x1={padL}
            y1={avgY}
            x2={W - padR}
            y2={avgY}
            stroke="var(--color-fg-subtle)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <text
            x={W - padR}
            y={avgY - 5}
            textAnchor="end"
            className="fill-fg-subtle text-[10px]"
          >
            평균 {avg.toFixed(1)}h
          </text>
        </>
      )}
      {/* 막대 */}
      {bars.map((b, i) => {
        const x = padL + i * slot + (slot - barW) / 2
        const h = (b.value / maxY) * innerH
        const y = baseY - h
        return (
          <g key={i}>
            {h > 0 && (
              <rect x={x} y={y} width={barW} height={h} rx={4} fill={b.color} />
            )}
            {b.value > 0 && (
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                className="fill-fg text-[11px] font-semibold"
              >
                {b.value}h
              </text>
            )}
            <text
              x={x + barW / 2}
              y={H - 8}
              textAnchor="middle"
              className="fill-fg-subtle text-[10px]"
            >
              {b.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** 일지 상태 분포 도넛 — 유효/수정요청/초안. */
function LogStatusDonut({ logs }: { logs: AdminTeamLogBrief[] }) {
  const segs = [
    {
      key: 'valid',
      label: '유효',
      color: LOG_COLOR.valid,
      n: logs.filter((l) => l.status === 'valid').length,
    },
    {
      key: 'change_requested',
      label: '수정 요청',
      color: LOG_COLOR.change_requested,
      n: logs.filter((l) => l.status === 'change_requested').length,
    },
    {
      key: 'draft',
      label: '초안',
      color: LOG_COLOR.draft,
      n: logs.filter((l) => l.status === 'draft').length,
    },
  ].filter((s) => s.n > 0)
  const total = logs.length
  const r = 52
  const c = 2 * Math.PI * r
  let acc = 0

  if (total === 0)
    return (
      <p className="text-fg-subtle px-5 py-8 text-center text-[13px]">
        아직 일지가 없어요
      </p>
    )

  return (
    <div className="flex items-center gap-5 px-5 py-4">
      <svg viewBox="0 0 140 140" className="h-[120px] w-[120px] shrink-0">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--color-surface-muted)"
          strokeWidth="16"
        />
        {segs.map((s) => {
          const len = (s.n / total) * c
          const el = (
            <circle
              key={s.key}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 70 70)"
            />
          )
          acc += len
          return el
        })}
        <text
          x="70"
          y="66"
          textAnchor="middle"
          className="fill-fg text-[22px] font-bold"
        >
          {total}
        </text>
        <text
          x="70"
          y="84"
          textAnchor="middle"
          className="fill-fg-subtle text-[11px]"
        >
          총 일지
        </text>
      </svg>
      <ul className="flex min-w-0 flex-col gap-2">
        {segs.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-fg-muted">{s.label}</span>
            <span className="text-fg font-bold tabular-nums">{s.n}건</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MentoringTeamDetailPage() {
  usePageHeader('멘토링 상세', '팀 개요 · 멘티 · 일지 · 관리')
  const { teamId } = useParams<{ teamId: string }>()
  const detail = useMentoringTeamDetail(teamId ?? null)
  // 관리 모달은 배정 보드의 row(멘토 교체 등에 필요)로 동작 — 이 팀의 기수 보드에서 row를 찾는다.
  const board = useMentorAssignments(detail.data?.cohortId)
  const [manageOpen, setManageOpen] = useState(false)
  const [earlyEndOpen, setEarlyEndOpen] = useState(false)
  const [addMenteesOpen, setAddMenteesOpen] = useState(false)
  const [reviewLogId, setReviewLogId] = useState<string | null>(null)

  if (detail.isPending) return <SkeletonListPage kpis={0} columns={4} />
  if (detail.isError || !detail.data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="멘토링 상세를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => detail.refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const d = detail.data
  const displayStatus: AssignmentDisplayStatus = !d.assignmentId
    ? 'unassigned'
    : d.status === 'early_ended'
      ? 'early_ended'
      : d.nHoursDone
        ? 'n_hours_done'
        : 'in_progress'
  const statusMeta = ASSIGNMENT_STATUS_META[displayStatus]
  const progress = d.recognizedHours ?? 0
  const remaining =
    d.allocatedHours !== null ? Math.max(0, d.allocatedHours - progress) : null
  const pct = d.recognizedPct
  const boardRow: MentorAssignmentRow | undefined = board.data?.rows.find(
    (r) => r.teamId === d.teamId,
  )
  const isInProgress = displayStatus === 'in_progress'
  const uncertified = d.logs.filter((l) => l.status !== 'valid').length

  // 할 일·경고 스트립 — 상황 요약 문장.
  type Alert = {
    tone: 'critical' | 'warning' | 'info' | 'positive'
    icon: typeof Clock
    text: string
  }
  const alerts: Alert[] = []
  if (!d.mentor)
    alerts.push({
      tone: 'critical',
      icon: AlertTriangle,
      text: '멘토가 배정되지 않았습니다.',
    })
  if (uncertified > 0)
    alerts.push({
      tone: 'warning',
      icon: ClockAlert,
      text: `미인증 일지 ${uncertified}건 — 검토가 필요합니다.`,
    })
  if (displayStatus === 'early_ended')
    alerts.push({
      tone: 'warning',
      icon: AlertTriangle,
      text: '조기 종료된 멘토링입니다 — 평가 가능 상태입니다.',
    })
  else if (displayStatus === 'n_hours_done')
    alerts.push({
      tone: 'positive',
      icon: CheckCircle2,
      text: '배정 N시간을 모두 채웠습니다.',
    })
  else if (isInProgress && remaining !== null && remaining > 0)
    alerts.push({
      tone: 'info',
      icon: Clock,
      text: `배정 시간까지 ${remaining}h 남았습니다.`,
    })
  if (d.logs.length === 0)
    alerts.push({
      tone: 'info',
      icon: FileText,
      text: '아직 작성된 일지가 없습니다.',
    })
  if (alerts.length === 0)
    alerts.push({
      tone: 'positive',
      icon: CheckCircle2,
      text: '특이사항 없이 진행 중입니다.',
    })

  const ALERT_TONE: Record<Alert['tone'], string> = {
    critical: 'bg-danger-bg text-danger',
    warning: 'bg-warning-bg text-warning',
    info: 'bg-info-bg text-info',
    positive: 'bg-success-bg text-success',
  }

  return (
    <div className="p-8">
      <Link
        to="/admin/mentors/assignments"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold"
      >
        <ArrowLeft className="h-4 w-4" />
        멘토 배정 관리로 돌아가기
      </Link>

      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-fg text-xl font-bold">{d.teamName}</h1>
            <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
          </div>
          <p className="text-fg-subtle mt-1 text-[13px]">
            멘티 {d.members.length}명
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {boardRow && (
            <button
              type="button"
              onClick={() => setManageOpen(true)}
              className="border-border text-fg-muted hover:bg-surface-muted bg-surface rounded-md border px-3 py-2 text-[12px] font-bold"
            >
              수정
            </button>
          )}
          <Link
            to={`/admin/mentoring/teams/${d.teamId}/log-fields`}
            className="border-border text-fg-muted hover:bg-surface-muted bg-surface inline-flex items-center gap-1 rounded-md border px-3 py-2 text-[12px] font-bold"
          >
            <FileText className="h-3.5 w-3.5" />
            일지 항목
          </Link>
          {boardRow && isInProgress && (
            <button
              type="button"
              onClick={() => setEarlyEndOpen(true)}
              className="border-warning text-warning hover:bg-warning/10 bg-surface rounded-md border px-3 py-2 text-[12px] font-bold"
            >
              조기 종료
            </button>
          )}
        </div>
      </div>

      {/* 할 일·경고 스트립 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {alerts.map((a, i) => {
          const Icon = a.icon
          return (
            <span
              key={i}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold',
                ALERT_TONE[a.tone],
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {a.text}
            </span>
          )
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* 좌 — 개요 + 추이 차트 + 일지 타임라인 */}
        <div className="flex flex-col gap-5">
          {/* 개요 */}
          <section className="border-border bg-surface rounded-xl border p-5">
            <div className="flex items-center gap-3">
              {d.mentor ? (
                <>
                  <Avatar name={d.mentor.name} size={40} />
                  <div>
                    <p className="text-fg-subtle text-[11px]">멘토</p>
                    <p className="text-fg text-[15px] font-bold">
                      {d.mentor.name}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <span className="bg-fg-subtle text-on-color inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
                    ?
                  </span>
                  <p className="text-fg-subtle text-[15px] font-medium">
                    멘토 미배정
                  </p>
                </>
              )}
            </div>
            <div className="border-border mt-4 flex flex-col gap-2 border-t pt-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-fg-muted inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  진행{' '}
                  <b className="text-fg tabular-nums">
                    {d.recognizedHours !== null ? `${progress}h` : '-'}
                  </b>
                  {remaining !== null && (
                    <>
                      {' · '}잔여{' '}
                      <b className="text-fg tabular-nums">{remaining}h</b>
                    </>
                  )}
                </span>
                {d.allocatedHours !== null && (
                  <span className="text-fg-subtle tabular-nums">
                    배정 {d.allocatedHours}h{pct !== null && ` · ${pct}%`}
                  </span>
                )}
              </div>
              {pct !== null && (
                <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      progressFillClass(pct),
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* 회차별 인정 시간 */}
          <section className="border-border bg-surface rounded-xl border p-5">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-fg text-[15px] font-bold">회차별 인정 시간</p>
              <span className="text-fg-subtle text-[12px]">
                누적 {progress}h
                {d.allocatedHours !== null && ` / 배정 ${d.allocatedHours}h`}
              </span>
            </div>
            {d.logs.length === 0 ? (
              <p className="text-fg-subtle py-8 text-center text-[13px]">
                아직 일지가 없어요
              </p>
            ) : (
              <RoundHoursBarChart logs={d.logs} />
            )}
          </section>

          {/* 일지 타임라인 */}
          <section className="border-border bg-surface rounded-xl border">
            <div className="border-border flex items-center justify-between border-b px-5 py-3.5">
              <p className="text-fg text-[15px] font-bold">멘토링 일지</p>
              <Link
                to="/admin/mentoring/logs"
                className="text-brand hover:text-brand-deep text-[12px] font-semibold"
              >
                전체 보기
              </Link>
            </div>
            {d.logs.length === 0 ? (
              <p className="text-fg-subtle px-5 py-8 text-center text-[13px]">
                작성된 일지가 없어요
              </p>
            ) : (
              <ol className="px-5 py-4">
                {d.logs.map((log, i) => {
                  const key =
                    log.resubmitted && log.status === 'valid'
                      ? 'resubmitted_valid'
                      : log.status
                  const meta = LOG_STATUS_META[key] ?? {
                    label: log.status,
                    tone: 'neutral' as const,
                  }
                  const color = logColorOf(log.status, log.resubmitted)
                  const last = i === d.logs.length - 1
                  return (
                    <li
                      key={log.logId}
                      className="relative flex gap-3 pb-4 last:pb-0"
                    >
                      {/* 타임라인 축 */}
                      <div className="relative flex flex-col items-center">
                        <span
                          className="mt-0.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white"
                          style={{ background: color }}
                        />
                        {!last && (
                          <span className="bg-border w-px flex-1" aria-hidden />
                        )}
                      </div>
                      {/* 항목 클릭 → 검토 모달(상세·승인·수정요청) */}
                      <button
                        type="button"
                        onClick={() => setReviewLogId(log.logId)}
                        className="hover:bg-surface-muted -mx-2 -my-1 flex min-w-0 flex-1 items-start justify-between gap-3 rounded-lg px-2 py-1 text-left transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-fg text-[13px] font-semibold">
                            {log.roundLabel}
                          </p>
                          <p className="text-fg-subtle text-[11px]">
                            {log.performedAtLabel}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2.5">
                          {log.recognizedHours !== null && (
                            <span className="text-fg-muted text-[12px] tabular-nums">
                              {log.recognizedHours}h
                            </span>
                          )}
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>

        {/* 우 — 일지 상태 도넛 + 멘티 명단 */}
        <div className="flex flex-col gap-5">
          <section className="border-border bg-surface h-fit rounded-xl border">
            <div className="border-border border-b px-5 py-3.5">
              <p className="text-fg text-[15px] font-bold">일지 상태 분포</p>
            </div>
            <LogStatusDonut logs={d.logs} />
          </section>

          <section className="border-border bg-surface h-fit rounded-xl border">
            <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3.5">
              <p className="text-fg inline-flex items-center gap-2 text-[15px] font-bold">
                <Users className="text-fg-muted h-4 w-4" />
                멘티 명단
                <span className="text-fg-subtle text-[12px] font-normal">
                  {d.members.length}명
                </span>
              </p>
              <button
                type="button"
                onClick={() => setAddMenteesOpen(true)}
                className="border-border text-fg-muted hover:bg-surface-muted bg-surface inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-bold"
              >
                <UserPlus className="h-3.5 w-3.5" />
                추가
              </button>
            </div>
            {d.members.length === 0 ? (
              <p className="text-fg-subtle px-5 py-8 text-center text-[13px]">
                등록된 멘티가 없어요
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {d.members.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center gap-2.5 px-5 py-2.5"
                  >
                    <Avatar name={m.name} size={26} />
                    <span className="text-fg text-[13px] font-medium">
                      {m.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* 관리 모달 */}
      {manageOpen && boardRow && board.data && (
        <AssignmentManageModal
          open
          onClose={() => setManageOpen(false)}
          row={boardRow}
          data={board.data}
        />
      )}
      {earlyEndOpen && boardRow && (
        <EarlyEndModal
          open
          onClose={() => setEarlyEndOpen(false)}
          row={boardRow}
        />
      )}
      {addMenteesOpen && (
        <AddMenteesModal
          open
          onClose={() => setAddMenteesOpen(false)}
          teamId={d.teamId}
          cohortId={d.cohortId}
          existingIds={d.members.map((m) => m.userId)}
        />
      )}
      {reviewLogId && (
        <LogReviewModal
          open
          onClose={() => setReviewLogId(null)}
          logId={reviewLogId}
        />
      )}
    </div>
  )
}
