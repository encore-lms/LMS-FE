import { Suspense, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Search,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import {
  useMentoringRequestAction,
  useMentoringRequests,
} from '../api/requests'
import { MENTOR_FLOW_CAPTION } from '../constants'
import type { MentoringRequestItem } from '../types'
import { RequestCard } from './RequestCard'
import {
  REQUEST_TABS,
  RESPONSE_SAVED_TOAST,
  matchRequestTab,
  type MentoringRequestTab,
} from './requestMeta'

const PERIOD_OPTIONS = [
  { value: '7', label: '최근 7일' },
  { value: '30', label: '최근 30일' },
  { value: '90', label: '최근 90일' },
  { value: 'all', label: '전체' },
] as const

const DAY_MS = 24 * 60 * 60 * 1000

const withinDays = (
  anchorMs: number,
  request: MentoringRequestItem,
  days: number | null,
) =>
  days === null ||
  anchorMs - new Date(request.activityAt).getTime() <= days * DAY_MS

// 멘토링 예약 요청 (/mentor/mentoring-requests) — Figma 2553:3820.
// KPI 4 · 필터 툴바(상태 탭 6 + 기간 + 검색) · 요청 카드 · 예약 정책 요약 배너.
// :requestId 응답 모달은 중첩 라우트(Outlet)로 목록 위에 오버레이.
export default function RequestsPage() {
  usePageHeader('멘토링 예약 요청', MENTOR_FLOW_CAPTION)
  const { data, isPending, isError, refetch } = useMentoringRequests()
  const toast = useToast()
  // '제안 취소' — 카드에서 즉시 처리(명세 cancel 재사용은 mock 한정 가정, mockDb 주석 참조).
  const cancelMutation = useMentoringRequestAction()

  const [tab, setTab] = useState<MentoringRequestTab>('open')
  const [period, setPeriod] = useState<string>('30')
  const [q, setQ] = useState('')

  const requests = useMemo(() => data?.requests ?? [], [data])

  // 기간 필터 기준일 — D-day·기간 기준 규칙 BE 확정 대기(openQuestion). mock 더미 보존을 위해
  // 목록 내 최근 활동 시각을 기준으로 상대 계산한다(실서버 연동 시 서버 필터로 대체 TODO).
  const anchorMs = useMemo(
    () =>
      requests.reduce(
        (max, r) => Math.max(max, new Date(r.activityAt).getTime()),
        0,
      ),
    [requests],
  )
  const periodDays = period === 'all' ? null : Number(period)

  // 기간 + 팀명·요청자 검색 적용 목록(탭 카운트 배지의 분모).
  const searched = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return requests.filter((r) => {
      if (!withinDays(anchorMs, r, periodDays)) return false
      if (needle) {
        const hay = `${r.teamName} ${r.requester.name}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [requests, periodDays, q, anchorMs])

  const visible = searched.filter((r) => matchRequestTab(r, tab))

  if (isPending) {
    return <div className="text-fg-muted p-8">예약 요청을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="예약 요청을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // KPI — 상태 집계(완료만 캡션과 동일한 '최근 30일' 고정 창 기준).
  const kpis = {
    requested: requests.filter((r) => r.status === 'requested').length,
    counterProposed: requests.filter((r) => r.status === 'counter_proposed')
      .length,
    confirmed: requests.filter((r) => r.status === 'confirmed').length,
    completed: requests.filter(
      (r) => r.status === 'completed' && withinDays(anchorMs, r, 30),
    ).length,
  }

  const onCancelProposal = (requestId: string) =>
    cancelMutation.mutate(
      { requestId, action: 'cancel' },
      {
        onSuccess: () => toast.success(RESPONSE_SAVED_TOAST),
        onError: () =>
          toast.danger('제안 취소에 실패했어요. 잠시 후 다시 시도해 주세요.'),
      },
    )

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* KPI 4 — 우상단 아이콘은 Figma KPI 카드 정합(멘토링 예약 2553:3820) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="요청 대기"
          icon={<Timer className="text-warning h-4 w-4" />}
          value={<KpiCount count={kpis.requested} />}
          hint="처리 필요 · D-0 ~ D+1"
        />
        <KpiCard
          label="조정 제안"
          icon={<Calendar className="text-accent-strong h-4 w-4" />}
          value={<KpiCount count={kpis.counterProposed} />}
          hint="수강생 응답 대기"
        />
        <KpiCard
          label="확정"
          icon={<Check className="text-brand h-4 w-4" />}
          value={<KpiCount count={kpis.confirmed} />}
          hint="예정된 멘토링"
        />
        <KpiCard
          label="완료"
          icon={<CheckCircle2 className="text-success h-4 w-4" />}
          value={<KpiCount count={kpis.completed} />}
          hint="최근 30일 진행"
        />
      </div>

      {/* 필터 툴바 — 상태 탭 6 + 기간 드롭다운 + 팀명·요청자 검색 */}
      <section className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 shadow-[0_2px_8px_rgba(18,23,38,0.04)]">
        <div className="flex flex-wrap items-center gap-2">
          {REQUEST_TABS.map((t) => {
            const active = tab === t.value
            const count = searched.filter((r) =>
              matchRequestTab(r, t.value),
            ).length
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTab(t.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3.5 py-[7px] text-[13px] whitespace-nowrap',
                  active
                    ? 'bg-brand-deep text-on-color font-bold'
                    : 'border-border text-fg bg-surface hover:bg-surface-muted border font-medium',
                )}
              >
                {t.dot && !active && (
                  <span
                    className={cn('h-1.5 w-1.5 rounded-full', t.dot)}
                    aria-hidden
                  />
                )}
                {t.label}
                <span
                  className={cn(
                    'rounded-[5px] px-1.5 py-0.5 text-[11px] font-bold',
                    active
                      ? 'bg-surface text-fg'
                      : 'bg-surface-muted text-fg-muted',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="border-border flex h-[34px] items-center gap-1.5 rounded-lg border px-3">
            <Calendar className="text-fg-muted h-3 w-3 shrink-0" />
            <select
              aria-label="기간 필터"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-fg appearance-none bg-transparent text-xs font-medium outline-none"
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="text-fg-subtle pointer-events-none h-2.5 w-2.5 shrink-0" />
          </label>
          <label className="border-border flex h-[34px] w-[220px] items-center gap-2 rounded-lg border px-3">
            <Search className="text-fg-subtle h-3 w-3 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="팀명·요청자 검색"
              aria-label="팀명·요청자 검색"
              className="text-fg placeholder:text-fg-subtle min-w-0 flex-1 bg-transparent text-xs outline-none"
            />
          </label>
        </div>
      </section>

      {/* 요청 카드 목록 — 응답 결과는 mock 상태 변경 + invalidate 로 즉시 반영 */}
      {visible.map((request) => (
        <RequestCard
          key={request.requestId}
          request={request}
          onCancelProposal={onCancelProposal}
          cancelPending={cancelMutation.isPending}
        />
      ))}
      {visible.length === 0 && <Empty title="조건에 맞는 요청이 없어요" />}

      {/* /:requestId 응답 모달 — 목록 상태(탭·검색) 유지한 채 오버레이 */}
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </div>
  )
}

// KPI 값 행 — 큰 숫자 + '건' 단위(M1 KpiValue 선례).
function KpiCount({ count }: { count: number }) {
  return (
    <span className="flex items-baseline gap-1">
      {count}
      <span className="text-fg-muted text-[13px] font-medium">건</span>
    </span>
  )
}
