import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { TestModeBar } from '@/components/dev/TestModeBar'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useMentoring } from '../api/mentoring'
import { MentoringHero } from './components/MentoringHero'
import { MentoringStatCards } from './components/MentoringStatCards'
import { ActiveRequestCard } from './components/ActiveRequestCard'
import {
  NewRequestForm,
  type NewRequestValues,
} from './components/NewRequestForm'
import { ConfirmedReservationCard } from './components/ConfirmedReservationCard'
import { HistoryTable } from './components/HistoryTable'
import { CancelRequestModal } from './components/CancelRequestModal'
import {
  MentoringToast,
  type MentoringToastTone,
} from './components/MentoringToast'
import type {
  MentoringActiveRequest,
  MentoringData,
  MentoringHistoryRow,
  MentoringReservation,
} from './types'

type ToastKey = 'requested' | 'accepted' | 'canceled'

const TOAST: Record<
  ToastKey,
  {
    tone: MentoringToastTone
    label: string
    message: string
    sub: string
    action: string
  }
> = {
  requested: {
    tone: 'success',
    label: 'REQUESTED',
    message: '멘토링 요청이 제출되었습니다',
    sub: '팀원 모두가 요청 상태를 볼 수 있습니다. 멘토가 응답하면 조정 제안 또는 확정 예약으로 표시됩니다.',
    action: '멘토링 보기 →',
  },
  accepted: {
    tone: 'success',
    label: 'ACCEPTED',
    message: '조정 제안을 수락했습니다',
    sub: '확정 예약으로 전환되었습니다. 확정 후 일정·장소 변경이나 취소는 멘토만 가능합니다.',
    action: '확정 예약 보기 →',
  },
  canceled: {
    tone: 'warning',
    label: 'CANCELED',
    message: '멘토링 요청이 취소되었습니다',
    sub: '진행 중 요청이 없어 새 멘토링 요청을 다시 보낼 수 있습니다.',
    action: '새 요청 작성 →',
  },
}

const POLICY = [
  { k: '요청 단위', v: '팀 단위만 허용' },
  { k: '요청 권한', v: '팀원 누구나 · 요청자 기록' },
  { k: '중복', v: '팀당 진행 중 1개' },
  { k: '취소', v: '확정 전까지 수강생 가능' },
  { k: '확정 후', v: '멘토만 변경/취소' },
  { k: '일지', v: '상세 비공개 · 요약만' },
]

// 멘토 미배정 시 스탯 캡션 (Figma 3206:2514).
const NO_MENTOR_CAPTION: Record<string, string> = {
  waiting: '팀 요청 후 멘토 미응답',
  proposed: '멘토 배정 후 표시',
  confirmed: '멘토 배정 후 표시',
  done: '최근 완료 기록 없음',
}

/**
 * 수강생 멘토링 (/student/mentoring) — Figma 2651:5430 외 변형.
 * 완료 알림은 화면 상단 고정 토스트(?toast=requested/accepted/canceled),
 * 취소 모달(?modal=cancel-request), 멘토 미배정(?state=no-mentor).
 */
export default function MentoringPage() {
  const { data, isPending, isError, refetch } = useMentoring()
  usePageHeader('멘토링')

  if (isPending)
    return <div className="text-fg-muted p-8">멘토링을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="멘토링을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }
  return <MentoringView data={data} />
}

function MentoringView({ data }: { data: MentoringData }) {
  const [params, setParams] = useSearchParams()
  const noMentor = params.get('state') === 'no-mentor' || !data.mentor.assigned

  // 상호작용 상태 — 요청 생성/취소/수락에 따라 진행 중 요청·확정 예약이 변한다.
  const [activeRequest, setActiveRequest] =
    useState<MentoringActiveRequest | null>(data.activeRequest)
  const [reservation, setReservation] = useState<MentoringReservation | null>(
    data.reservation,
  )
  const [history, setHistory] = useState<MentoringHistoryRow[]>(data.history)
  // 새로 수락한 확정 예약이 "진행 중 슬롯"을 점유 중인지. 초기 목 예약(과거 일정)은 참고용이라 false.
  const [reservationUpcoming, setReservationUpcoming] = useState(false)
  const [toast, setToast] = useState<ToastKey | null>(() => {
    const t = params.get('toast') as ToastKey | null
    return t && TOAST[t] ? t : null
  })
  const [modalOpen, setModalOpen] = useState(
    params.get('modal') === 'cancel-request',
  )

  const topRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const reservationRef = useRef<HTMLDivElement>(null)

  // 멘토 미배정: 히어로(배정 대기)·0 통계·비활성 폼·정책만. 진행 요청/예약/기록은 숨김.
  const display: MentoringData = noMentor
    ? {
        ...data,
        mentor: { ...data.mentor, assigned: false },
        kpis: {
          inProgress: 0,
          requestLimit: 1,
          completed: 0,
          cumulativeHours: 0,
          remainingHours: 0,
        },
        stats: data.stats.map((s) => ({
          ...s,
          value: 0,
          caption: NO_MENTOR_CAPTION[s.key] ?? s.caption,
        })),
        activeRequest: null,
        reservation: null,
        history: [],
      }
    : {
        ...data,
        kpis: { ...data.kpis, inProgress: activeRequest ? 1 : 0 },
        stats: data.stats.map((s) => {
          if (s.key === 'waiting')
            return {
              ...s,
              value: activeRequest?.status === 'requested' ? 1 : 0,
            }
          if (s.key === 'proposed')
            return { ...s, value: activeRequest?.status === 'proposed' ? 1 : 0 }
          if (s.key === 'confirmed') return { ...s, value: reservation ? 1 : 0 }
          return s
        }),
        activeRequest,
        reservation,
        history,
      }

  // 진행 중 요청이 1건이라도 있으면(요청 대기/조정 제안 OR 수락된 확정 예약) 새 요청 폼을 막는다
  // (팀당 진행 중 1개 한도).
  // TODO(BE): "진행 중" 판정·만료 재오픈은 서버 권한이다. 확정 예약의 일정이 지나면 BE가
  //   완료/이력으로 전환해 슬롯을 비우고 activeRequest 를 비워 내려줘야 한다. FE는 API가
  //   내려주는 진행 중 요청 유무만 반영한다. 아래 simulateElapse / reservationUpcoming 은
  //   배포 데모에서 이 흐름을 눈으로 보기 위한 FE 목 전용이며 BE 연동 시 제거한다.
  const slotTaken = !!activeRequest || reservationUpcoming

  // 새 요청 제출 → 진행 중 요청 생성 + requested 토스트.
  // 데모에선 멘토가 곧바로 조정 제안을 한 것으로 처리해 "조정 제안" 카드를 띄운다
  // (실제로는 요청 대기 → 멘토 응답 후 proposed 로 전환됨 — BE/멘토 영역).
  const submitRequest = (v: NewRequestValues) => {
    const schedule = `${v.date} ${v.startTime} ~ ${v.endTime}`
    setActiveRequest({
      id: `req_${Math.random().toString(36).slice(2, 6)}`,
      status: 'proposed',
      proposedAtLabel: '방금 전',
      student: {
        person: '나 (요청자)',
        datetime: schedule,
        placeType: v.placeType,
        placeDetail: v.placeDetail,
        memo: v.memo?.trim() ? v.memo : '—',
      },
      proposal: {
        person: `${data.mentor.name} 멘토`,
        datetime: `${v.date} 18:30 ~ 20:30`,
        placeType: '오프라인',
        placeDetail: '플레이데이터 강남캠퍼스 세미나실 B',
        memo: '오프라인이 더 효율적 — 캠퍼스 추천',
      },
    })
    setToast('requested')
  }

  // 요청 취소 / 제안 거절 → 진행 중 요청 해제 + canceled 토스트(폼 활성화).
  const cancelRequest = () => {
    setActiveRequest(null)
    setModalOpen(false)
    setToast('canceled')
  }

  // 제안 수락 → 멘토 제안을 확정 예약으로 전환(슬롯 점유 유지) + accepted 토스트.
  const acceptProposal = () => {
    const p = activeRequest?.proposal
    if (p) {
      const [dateLabel, ...rest] = p.datetime.split(' ')
      setReservation({
        id: `res_${Math.random().toString(36).slice(2, 6)}`,
        dateLabel,
        timeLabel: rest.join(' '),
        placeType: p.placeType,
        placeDetail: p.placeDetail,
        estHours: '2h',
        mentorName: data.mentor.name,
        mentorSpecialty: data.mentor.specialty,
      })
      setReservationUpcoming(true)
    }
    setActiveRequest(null)
    setToast('accepted')
  }

  // ─── SIMULATION ONLY (FE 목 전용) — BE 연동 시 이 함수와 호출부 제거 ───
  // 실제로는 BE가 일정 경과를 감지해 진행 중 요청을 완료/만료 처리하고 슬롯을 비운다.
  // 데모에서 그 시점을 버튼으로 흉내낸다: 확정 예약은 완료 기록으로 이동, 미확정 요청은 만료.
  const simulateElapse = () => {
    if (reservationUpcoming && reservation) {
      const nextRound = history.reduce((m, r) => Math.max(m, r.round), 0) + 1
      setHistory([
        {
          round: nextRound,
          datetime: `${reservation.dateLabel} ${reservation.timeLabel}`,
          place: `${reservation.placeType} · ${reservation.placeDetail}`,
          hours: `예상 ${reservation.estHours} / 실제 ${reservation.estHours}`,
          requester: '나 (요청자)',
        },
        ...history,
      ])
      setReservation(null)
      setReservationUpcoming(false)
    } else if (activeRequest) {
      // 확정 전 요청(요청 대기/조정 제안)은 일정이 지나면 세션 없이 만료된다.
      setActiveRequest(null)
    }
    setToast(null)
  }

  // 토스트 액션 — 관련 영역으로 스크롤.
  const handleToastAction = () => {
    const target =
      toast === 'accepted'
        ? reservationRef.current
        : toast === 'canceled'
          ? formRef.current
          : topRef.current
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // 데모용 — 멘토 배정 전/후 화면을 임의로 전환 (?state=no-mentor 토글).
  const setNoMentor = (next: boolean) => {
    const p = new URLSearchParams(params)
    if (next) p.set('state', 'no-mentor')
    else p.delete('state')
    p.delete('toast')
    p.delete('modal')
    setParams(p, { replace: true })
    setToast(null)
    setModalOpen(false)
  }

  return (
    <div ref={topRef} className="flex flex-col gap-5 p-8">
      {toast && (
        <MentoringToast
          tone={TOAST[toast].tone}
          label={TOAST[toast].label}
          message={TOAST[toast].message}
          sub={TOAST[toast].sub}
          actionLabel={TOAST[toast].action}
          onAction={handleToastAction}
          onClose={() => setToast(null)}
        />
      )}

      {/* 데모 컨트롤 (FE 목 전용) — 멘토 배정 전/후 + 일정 경과 시뮬레이션 */}
      <DemoControls
        noMentor={noMentor}
        onToggleNoMentor={setNoMentor}
        canElapse={!noMentor && slotTaken}
        onElapse={simulateElapse}
      />

      {/* 상단 안내 칩 */}
      <div className="flex items-center justify-end gap-2">
        <span className="bg-surface-muted text-fg-muted rounded-md px-2.5 py-1 text-[11px] font-medium">
          {noMentor
            ? 'ⓘ 운영자가 멘토를 배정하면 팀 단위 멘토링 요청을 시작할 수 있습니다'
            : 'ⓘ 팀당 진행 중 요청 1개만 허용 · 확정 후 변경/취소는 멘토만 가능'}
        </span>
      </div>

      <MentoringHero data={display} />
      <MentoringStatCards stats={display.stats} />

      {display.activeRequest?.status === 'proposed' && (
        <ActiveRequestCard
          request={display.activeRequest}
          onCancel={() => setModalOpen(true)}
          onReject={() => setModalOpen(true)}
          onAccept={acceptProposal}
        />
      )}

      <div ref={formRef}>
        <NewRequestForm
          disabled={slotTaken || noMentor}
          variant={noMentor ? 'no-mentor' : 'active'}
          onSubmit={submitRequest}
        />
      </div>

      {display.reservation && (
        <div ref={reservationRef}>
          <ConfirmedReservationCard r={display.reservation} />
        </div>
      )}
      {display.history.length > 0 && <HistoryTable rows={display.history} />}

      {/* 멘토링 정책 */}
      <section className="bg-info-bg border-info flex items-center gap-3.5 rounded-[14px] border p-[18px]">
        <span className="bg-surface text-info flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold">
          ⓘ
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-fg text-[14px] font-bold">멘토링 정책</span>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {POLICY.map((p) => (
              <div key={p.k} className="flex flex-col gap-px">
                <span className="text-fg-subtle text-[10px] font-medium tracking-wider">
                  {p.k}
                </span>
                <span className="text-fg text-[12px] font-bold">{p.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CancelRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={cancelRequest}
      />
    </div>
  )
}

// 데모/시뮬레이션 컨트롤 (FE 목 전용) — 공용 TestModeBar(보라 테스트색)로 감싼다.
// BE 연동 시 컴포넌트와 사용처를 함께 제거한다.
// 1) 멘토 배정 전/후 화면 전환  2) "일정 경과" → 진행 중 슬롯 해제(BE 자동 처리 흉내).
function DemoControls({
  noMentor,
  onToggleNoMentor,
  canElapse,
  onElapse,
}: {
  noMentor: boolean
  onToggleNoMentor: (next: boolean) => void
  canElapse: boolean
  onElapse: () => void
}) {
  return (
    <TestModeBar
      note="멘토 배정 전/후 · 일정 경과 시뮬레이션"
      className="self-start"
    >
      <div className="flex items-center gap-1">
        {(
          [
            ['멘토 배정 후', false],
            ['멘토 배정 전', true],
          ] as const
        ).map(([label, value]) => (
          <button
            key={label}
            type="button"
            onClick={() => onToggleNoMentor(value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors',
              noMentor === value
                ? 'bg-accent-strong text-white'
                : 'text-accent-strong/70 hover:text-accent-strong',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {canElapse && (
        <button
          type="button"
          onClick={onElapse}
          title="진행 중 요청/예약의 일정이 지난 상황을 시뮬레이션 (실제로는 BE가 처리)"
          className="border-accent-strong/40 text-accent-strong hover:bg-accent-strong/10 rounded-md border border-dashed px-2.5 py-1 text-[11px] font-bold transition-colors"
        >
          ⏩ 일정 경과 시뮬레이션
        </button>
      )}
    </TestModeBar>
  )
}
