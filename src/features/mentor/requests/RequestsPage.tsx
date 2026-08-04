import { Suspense, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Calendar, Check, CheckCircle2, Timer } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { Tabs } from '@/components/ui/Tabs'
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
import { SkeletonListPage } from '@/components/ui/Skeleton'
import {
  REQUEST_TABS,
  RESPONSE_SAVED_TOAST,
  matchRequestTab,
  type MentoringRequestTab,
} from './requestMeta'
import { SearchInput } from '@/components/ui/SearchInput'
import { FilterSelect } from '@/components/ui/FilterSelect'
import RequestResponseModal from './RequestResponseModal'

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
export default function RequestsPage({
  embedded = false,
  teamId,
}: {
  /** 팀 상세 '예약' 탭에 얹을 때 — 자체 헤더·바깥 여백을 생략한다. */
  embedded?: boolean
  /** 주면 그 팀 요청만 — 팀 상세에서는 다른 팀 요청이 섞이면 안 된다. */
  teamId?: string
} = {}) {
  usePageHeader('멘토링 예약 요청', MENTOR_FLOW_CAPTION, !embedded)
  const { data, isPending, isError, refetch } = useMentoringRequests()
  const toast = useToast()
  // '제안 취소' — 카드에서 즉시 처리(명세 cancel 재사용은 mock 한정 가정, mockDb 주석 참조).
  const cancelMutation = useMentoringRequestAction()

  // 팀 안에서 그 자리에 띄운 응답 화면 — 라우트 대신 값으로 연다.
  const [openRequest, setOpenRequest] = useState<{
    id: string
    mode: string
  } | null>(null)
  const [tab, setTab] = useState<MentoringRequestTab>('open')
  // 팀 상세에 얹힐 때는 기간을 자르지 않는다 — 그 팀 것이 몇 건 안 되는데 최근 30일로
  // 잘리면 홈에서 센 건수와 어긋나 보인다.
  const [period, setPeriod] = useState<string>(teamId ? 'all' : '30')
  const [q, setQ] = useState('')

  const requests = useMemo(() => {
    const all = data?.requests ?? []
    return teamId ? all.filter((r) => r.teamId === teamId) : all
  }, [data, teamId])

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

  // 탭 안에서는 활동 시각 최신순 — BE는 요청 일시 하나로만 정렬해 내려주므로
  // '확정' 탭에서도 확정 일시가 아닌 요청 순으로 섞여 보였다. activityAt 은 상태별로
  // 의미 있는 시각(확정=확정 일시, 조정 제안=제안 일시, 그 외=요청 일시)이다.
  const visible = useMemo(
    () =>
      searched
        .filter((r) => matchRequestTab(r, tab))
        .sort(
          (a, b) =>
            new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime(),
        ),
    [searched, tab],
  )

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
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonListPage kpis={3} columns={5} className="" />}
      errorTitle="예약 요청을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className={embedded ? '' : 'p-8'}
    >
      <div className={cn('flex flex-col gap-5', !embedded && 'p-8')}>
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
        <section className="bg-surface-muted/50 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-2.5">
          <Tabs
            aria-label="요청 상태 필터"
            value={tab}
            onChange={(v) => setTab(v as MentoringRequestTab)}
            items={REQUEST_TABS.map((t) => ({
              value: t.value,
              label: t.label,
              dot: t.dot,
              count: searched.filter((r) => matchRequestTab(r, t.value)).length,
            }))}
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              icon={<Calendar className="text-fg-muted h-3 w-3 shrink-0" />}
              label="기간"
              value={period}
              onChange={setPeriod}
              options={PERIOD_OPTIONS}
              className="h-[34px]"
            />
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="팀명·요청자 검색"
              ariaLabel="팀명·요청자 검색"
              className="h-[34px] w-[220px]"
            />
          </div>
        </section>

        {/* 요청 카드 목록 — 응답 결과는 mock 상태 변경 + invalidate 로 즉시 반영 */}
        {visible.map((request) => (
          <RequestCard
            key={request.requestId}
            request={request}
            onCancelProposal={onCancelProposal}
            cancelPending={cancelMutation.isPending}
            onOpen={
              embedded
                ? (mode) => setOpenRequest({ id: request.requestId, mode })
                : undefined
            }
          />
        ))}
        {visible.length === 0 && <Empty title="조건에 맞는 요청이 없어요" />}

        {/* /:requestId 응답 모달 — 목록 상태(탭·검색) 유지한 채 오버레이 */}
        <Suspense fallback={null}>
          {/* 팀 안에서 연 응답 화면 — 같은 화면 위에 그대로 띄운다 */}
          {embedded && openRequest && (
            <RequestResponseModal
              requestId={openRequest.id}
              mode={openRequest.mode}
              onClose={() => setOpenRequest(null)}
              onResponded={() => setOpenRequest(null)}
            />
          )}

          <Outlet />
        </Suspense>
      </div>
    </DataBoundary>
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
