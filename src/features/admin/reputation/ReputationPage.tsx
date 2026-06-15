import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, Info, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useReputation } from './api'
import type {
  EndorsementStatus,
  MentorEvalStatus,
  PushTarget,
  ReputationStudent,
} from './types'

const ENDORSEMENT_META: Record<
  EndorsementStatus,
  { label: string; tone: BadgeTone }
> = {
  collected: { label: '수집됨', tone: 'success' },
  not_collected: { label: '미수집', tone: 'neutral' },
  requesting: { label: '요청 중', tone: 'warning' },
}

const MENTOR_EVAL_META: Record<
  MentorEvalStatus,
  { label: string; tone: BadgeTone }
> = {
  recommended: { label: '평가 완료 · 추천', tone: 'success' },
  not_recommended: { label: '평가 완료 · 추천 안 함', tone: 'success' },
  pending: { label: '평가 대기', tone: 'neutral' },
  not_eligible: { label: 'N시간 미달 · 대상 외', tone: 'neutral' },
  in_progress: { label: '평가 진행 중', tone: 'info' },
}

const PUSH_LABEL: Record<PushTarget, string> = {
  instructor: '강사 푸시',
  mentor: '멘토 푸시',
  peer: '동료 푸시',
}

type StatusFilter = 'all' | 'missing' | 'complete'

// 평판 관리 (/admin/reputation) — 운영(MANAGER/ADMIN) 신규.
// Figma 1193:6267. 수강생별 평판 수집 현황(강사 추천서·멘토 평가·동료 5축) + 요청 푸시.
// 내부 사용자 전용 — 외부 토큰 미사용. 푸시·일괄 푸시·상세는 별도 시안 미설계 → 토스트 + TODO.
export default function ReputationPage() {
  usePageHeader(
    '평판 관리',
    '수강생별 평판 수집 현황 · 강사·멘토·동료 요청 푸시 · 내부 사용자 전용',
  )
  const { data, isPending, isError, refetch } = useReputation()
  const toast = useToast()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')

  const students = useMemo(() => data?.students ?? [], [data])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return students.filter((s) => {
      if (status === 'missing' && s.pushTargets.length === 0) return false
      if (status === 'complete' && s.pushTargets.length > 0) return false
      if (needle) {
        const hay = `${s.name} ${s.uuid}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [students, status, q])

  if (isPending) {
    return <div className="text-fg-muted p-8">평판 현황을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="평판 현황을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { summary, pushFlows } = data

  const columns: Column<ReputationStudent>[] = [
    {
      key: 'student',
      header: '수강생',
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={s.name} size={28} />
          <div className="min-w-0">
            <p className="text-fg text-[13px] font-semibold">{s.name}</p>
            <p className="text-fg-subtle font-mono text-[11px]">{s.uuid}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'endorsement',
      header: '강사 추천서',
      cell: (s) => (
        <div className="flex flex-col gap-1">
          <StatusBadge
            label={ENDORSEMENT_META[s.endorsementStatus].label}
            tone={ENDORSEMENT_META[s.endorsementStatus].tone}
          />
          <span className="text-fg-subtle text-[11px]">{s.endorsementBy}</span>
        </div>
      ),
    },
    {
      key: 'mentor',
      header: '멘토 평가·추천',
      cell: (s) => (
        <div className="flex flex-col gap-1">
          <StatusBadge
            label={MENTOR_EVAL_META[s.mentorEvalStatus].label}
            tone={MENTOR_EVAL_META[s.mentorEvalStatus].tone}
          />
          <span className="text-fg-subtle text-[11px]">{s.mentorBy}</span>
        </div>
      ),
    },
    {
      key: 'peer',
      header: '동료 5축 (N/M)',
      className: 'w-40',
      cell: (s) => {
        const full = s.peerCount >= s.peerTotal
        return (
          <div className="flex items-center gap-2">
            <div className="bg-surface-muted h-1.5 w-20 overflow-hidden rounded-full">
              <div
                className={full ? 'bg-success h-full' : 'bg-brand h-full'}
                style={{
                  width: `${Math.round((s.peerCount / s.peerTotal) * 100)}%`,
                }}
              />
            </div>
            <span className="text-fg text-[13px] tabular-nums">
              {s.peerCount} / {s.peerTotal}
            </span>
          </div>
        )
      },
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-56',
      cell: (s) => (
        <div className="flex flex-wrap items-center gap-2">
          {s.pushTargets.length === 0 ? (
            <span className="text-success inline-flex items-center gap-1 text-[13px] font-semibold">
              <Check className="h-3.5 w-3.5" />
              완료
            </span>
          ) : (
            s.pushTargets.map((t) => (
              <button
                key={t}
                type="button"
                // TODO: 평판 요청 푸시(LMS 알림, P0_25 BE 계약 확정 후)
                onClick={() =>
                  toast.info(`${s.name} ${PUSH_LABEL[t]}는 준비 중입니다.`)
                }
                className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] font-semibold"
              >
                <Send className="h-3 w-3" />
                {PUSH_LABEL[t]}
              </button>
            ))
          )}
          <button
            type="button"
            // TODO: 수강생 평판 상세(P0_25)
            onClick={() => toast.info(`${s.name} 평판 상세는 준비 중입니다.`)}
            className="text-brand text-[13px] font-semibold hover:underline"
          >
            상세
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 접근 경계 칩 */}
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <span className="bg-info-bg text-info inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold">
          <Info className="h-3 w-3" />
          내부 사용자 전용 · 외부 토큰 미사용
        </span>
      </div>

      {/* 히어로 — 수집 현황 + 일괄 푸시 */}
      <div className="bg-brand-deep flex flex-col gap-4 rounded-2xl p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[17px] font-bold">
            수강생별 평판 수집 현황과 요청 푸시 추적
          </p>
          <p className="mt-2 text-[13px] text-white/75">
            {summary.cohortLabel} · {summary.students}명
            <span className="ml-2 inline-flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              누락 수강생 {summary.missingStudents}명
            </span>
          </p>
        </div>
        <button
          type="button"
          // TODO: 누락 수강생 일괄 요청 푸시(P0_25)
          onClick={() =>
            toast.info(
              `누락 ${summary.missingStudents}명 일괄 요청 푸시는 준비 중입니다.`,
            )
          }
          className="bg-surface text-brand-deep inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition-colors hover:bg-white/90"
        >
          <Send className="h-4 w-4" />
          일괄 요청 푸시 — 누락 {summary.missingStudents}명
        </button>
      </div>

      {/* KPI 4종 */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="수강생"
          value={summary.students}
          hint={summary.cohortLabel}
        />
        <KpiCard
          label="강사 추천서"
          value={summary.endorsements}
          hint={summary.endorsementsHint}
          tone="success"
        />
        <KpiCard
          label="멘토 평가·추천"
          value={summary.mentorEval}
          hint={summary.mentorEvalHint}
          tone="brand"
        />
        <KpiCard
          label="동료 5축"
          value={summary.peerAxes}
          hint={summary.peerAxesHint}
          tone="accent"
        />
      </div>

      {/* 필터 */}
      <div className="border-border bg-surface mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="상태 필터"
          className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
        >
          <option value="all">상태 전체</option>
          <option value="missing">누락 있음</option>
          <option value="complete">완료</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="수강생 검색"
          aria-label="수강생 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-52 rounded-lg border bg-white px-3 text-sm outline-none"
        />
      </div>

      {/* 평판 수집 그리드 */}
      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(s) => s.id}
          empty="조건에 맞는 수강생이 없어요"
        />
        <div className="text-fg-subtle mt-3 flex items-center justify-between text-xs">
          <span>
            총 {summary.students}명 · 누락 있음 {summary.missingStudents}명
          </span>
          <span className="bg-surface-muted text-fg-muted rounded-md px-2.5 py-1 font-bold">
            1 / 7
          </span>
        </div>
      </div>

      {/* 푸시 흐름 — 대상별 진입 화면 */}
      <div className="border-border bg-surface mt-6 rounded-xl border p-5">
        <p className="text-fg text-sm font-bold">
          푸시 흐름 — 대상별 진입 화면
        </p>
        <p className="text-fg-muted mt-1 text-xs">
          LMS 알림으로 처리 · 외부 토큰 URL 미사용 · 외부인 입력 흐름 없음
        </p>
        <ul className="mt-3 flex flex-col">
          {pushFlows.map((f) => (
            <li
              key={f.id}
              className="border-divider flex items-center gap-2 border-t py-2.5 text-[13px] first:border-t-0"
            >
              <span className="text-fg font-medium">{f.label}</span>
              {f.route && (
                <span className="text-fg-subtle font-mono text-[12px]">
                  {f.route}
                </span>
              )}
              <ArrowRight className="text-fg-subtle ml-auto h-4 w-4" />
            </li>
          ))}
        </ul>
      </div>

      {/* 평판 수집 정책 — 하단 콜아웃 */}
      <div className="border-info/30 bg-info-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-info inline-flex items-center gap-1.5 text-base font-bold">
          <Info className="h-4 w-4" />
          평판 수집 정책
        </p>
        <ul className="text-info/90 mt-2 flex flex-col gap-1.5 text-[13px] leading-relaxed">
          <li>
            내부 사용자 전용 — 동료 수강생·강사·멘토·매니저만 입력 (외부 현업
            동료 평판 수집 없음)
          </li>
          <li>
            멘토 평가는 N시간 완료 또는 운영자 조기 종료 팀에 대해서만 수집 대상
          </li>
          <li>푸시는 LMS 알림으로 처리 · 외부 토큰 URL 미사용</li>
        </ul>
      </div>
    </div>
  )
}
