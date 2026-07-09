import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast, type ToastTone } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import {
  useAcceptMentoringProposal,
  useCancelMentoringRequest,
  useCreateMentoringRequest,
  useMentoring,
} from '../api/mentoring'
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
import type {
  MentoringActiveRequest,
  MentoringData,
  MentoringHistoryRow,
  MentoringReservation,
} from './types'

type ToastKey = 'requested' | 'accepted' | 'canceled'

// 멘토링 완료 알림 — 공용 토스트(Figma 공통 Toast)로 표시한다.
const TOAST: Record<ToastKey, { tone: ToastTone; message: string }> = {
  requested: { tone: 'success', message: '멘토링 요청이 제출되었습니다' },
  accepted: { tone: 'success', message: '조정 제안을 수락했습니다' },
  canceled: { tone: 'warning', message: '멘토링 요청이 취소되었습니다' },
}

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
  const toast = useToast()
  const [params] = useSearchParams()
  const noMentor = params.get('state') === 'no-mentor' || !data.mentor.assigned
  const createRequest = useCreateMentoringRequest()
  const cancelRequestMutation = useCancelMentoringRequest()
  const acceptProposalMutation = useAcceptMentoringProposal()

  // 상호작용 상태 — 서버 응답을 즉시 반영한다.
  const [activeRequest, setActiveRequest] =
    useState<MentoringActiveRequest | null>(data.activeRequest)
  const [reservation, setReservation] = useState<MentoringReservation | null>(
    data.reservation,
  )
  const [history, setHistory] = useState<MentoringHistoryRow[]>(data.history)
  // 새로 수락한 확정 예약이 "진행 중 슬롯"을 점유 중인지. 초기 목 예약(과거 일정)은 참고용이라 false.
  const [reservationUpcoming, setReservationUpcoming] = useState(false)
  const [modalOpen, setModalOpen] = useState(
    params.get('modal') === 'cancel-request',
  )

  // 다른 화면에서 ?toast=... 로 진입하면 공용 토스트로 한 번 알린다.
  const greeted = useRef(false)
  useEffect(() => {
    if (greeted.current) return
    const t = params.get('toast') as ToastKey | null
    if (!t || !TOAST[t]) return
    greeted.current = true
    toast[TOAST[t].tone](TOAST[t].message)
  }, [params, toast])

  const applyMentoringData = (next: MentoringData) => {
    setActiveRequest(next.activeRequest)
    setReservation(next.reservation)
    setHistory(next.history)
    setReservationUpcoming(false)
  }

  useEffect(() => {
    applyMentoringData(data)
  }, [data])

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
        kpis: {
          ...data.kpis,
          inProgress: activeRequest || reservation ? 1 : 0,
        },
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

  // 진행 중 요청이나 확정 예약이 있으면 팀당 진행 중 1개 한도에 따라 새 요청 폼을 막는다.
  const slotTaken = !!activeRequest || !!reservation || reservationUpcoming

  const submitRequest = (v: NewRequestValues) => {
    createRequest.mutate(v, {
      onSuccess: (next) => {
        applyMentoringData(next)
        toast.success(TOAST.requested.message)
      },
      onError: () => {
        toast.danger('멘토링 요청 제출에 실패했어요')
      },
    })
  }

  const cancelRequest = () => {
    if (!activeRequest?.id) {
      setModalOpen(false)
      return
    }
    cancelRequestMutation.mutate(activeRequest.id, {
      onSuccess: (next) => {
        applyMentoringData(next)
        setModalOpen(false)
        toast.warning(TOAST.canceled.message)
      },
      onError: () => {
        toast.danger('멘토링 요청 취소에 실패했어요')
      },
    })
  }

  // 제안 수락 → 멘토 제안을 확정 예약으로 전환(슬롯 점유 유지) + accepted 토스트.
  const acceptProposal = () => {
    if (!activeRequest?.id) return
    acceptProposalMutation.mutate(activeRequest.id, {
      onSuccess: (next) => {
        applyMentoringData(next)
        toast.success(TOAST.accepted.message)
      },
      onError: () => {
        toast.danger('조정 제안 수락에 실패했어요')
      },
    })
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <MentoringHero data={display} />
      <MentoringStatCards stats={display.stats} />

      {display.activeRequest && (
        <ActiveRequestCard
          request={display.activeRequest}
          onCancel={() => setModalOpen(true)}
          onReject={() => setModalOpen(true)}
          onAccept={acceptProposal}
        />
      )}

      <NewRequestForm
        disabled={slotTaken || noMentor}
        variant={noMentor ? 'no-mentor' : 'active'}
        isSubmitting={createRequest.isPending}
        onSubmit={submitRequest}
      />

      {display.reservation && (
        <ConfirmedReservationCard r={display.reservation} />
      )}
      {display.history.length > 0 && <HistoryTable rows={display.history} />}

      <CancelRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={cancelRequest}
      />
    </div>
  )
}
