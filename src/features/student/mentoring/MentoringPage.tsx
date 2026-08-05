import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useToast, type ToastTone } from '@/components/ui/use-toast'
import { useCourseHubHeader } from '../course/useCourseHubHeader'
import {
  useAcceptMentoringProposal,
  useCancelMentoringRequest,
  useCreateMentoringRequest,
  useMentoring,
} from '../api/mentoring'
import { MentoringHero } from './components/MentoringHero'
import { MentoringSkeleton } from './components/MentoringSkeleton'
import { ActiveRequestCard } from './components/ActiveRequestCard'
import {
  NewRequestModal,
  type NewRequestValues,
} from './components/NewRequestModal'
import { ConfirmedReservationCard } from './components/ConfirmedReservationCard'
import { MentoringHistorySection } from './components/MentoringHistorySection'
import { CoMenteesPanel } from './components/CoMenteesPanel'
import { CancelRequestModal } from './components/CancelRequestModal'
import { MentoringProgressSummary } from './components/MentoringProgressSummary'
import { CourseTabs } from '../course/CourseTabs'
import type {
  MentoringActiveRequest,
  MentoringData,
  MentoringRequestPolicy,
  MentoringReservation,
} from './types'

type ToastKey = 'requested' | 'accepted' | 'canceled'

// 멘토링 완료 알림 — 공용 토스트(Figma 공통 Toast)로 표시한다.
const TOAST: Record<ToastKey, { tone: ToastTone; message: string }> = {
  requested: { tone: 'success', message: '멘토링 요청이 제출되었습니다' },
  accepted: { tone: 'success', message: '조정 제안을 수락했습니다' },
  canceled: { tone: 'warning', message: '멘토링 요청이 취소되었습니다' },
}

function activeRequestsOf(data: MentoringData) {
  return data.activeRequests ?? (data.activeRequest ? [data.activeRequest] : [])
}

function reservationsOf(data: MentoringData) {
  return data.reservations ?? (data.reservation ? [data.reservation] : [])
}

function requestPolicyOf(
  data: MentoringData,
  activeRequests: MentoringActiveRequest[],
  reservations: MentoringReservation[],
): MentoringRequestPolicy {
  if (data.requestPolicy) return data.requestPolicy

  const requestedCount = activeRequests.filter(
    (request) => request.status === 'requested',
  ).length
  const proposedCount = activeRequests.filter(
    (request) => request.status === 'proposed',
  ).length
  const reservedCount = reservations.filter(
    (reservation) => reservation.phase !== 'awaiting_completion',
  ).length
  const inUse = requestedCount + proposedCount + reservedCount
  const limit = data.kpis.requestLimit

  return {
    limit,
    inUse,
    canRequest: inUse < limit,
    requestedCount,
    proposedCount,
    reservedCount,
    blockReason: inUse < limit ? null : 'limit_reached',
  }
}

function limitReachedReason(policy: MentoringRequestPolicy) {
  const states = [
    policy.requestedCount > 0 && `요청 대기 ${policy.requestedCount}건`,
    policy.proposedCount > 0 && `조정 제안 ${policy.proposedCount}건`,
    policy.reservedCount > 0 && `확정 예약 ${policy.reservedCount}건`,
  ].filter(Boolean)

  return `${states.join(' · ')}으로 팀 한도(${policy.limit}건)에 도달했어요`
}

/**
 * 수강생 멘토링 (/student/mentoring) — Figma 2651:5430 외 변형.
 * 아웃라인 없는 flat: 히어로 + 좌(진행/확정/기록) · 우(함께 받는 팀원).
 * 새 요청은 기록 헤더의 버튼 → 팝업(NewRequestModal). 취소 모달(?modal=cancel-request),
 * 완료 알림은 상단 고정 토스트(?toast=requested/accepted/canceled), 멘토 미배정(?state=no-mentor).
 */
export default function MentoringPage() {
  const { data, isPending, isError, refetch } = useMentoring()
  useCourseHubHeader()

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<MentoringSkeleton />}
      errorTitle="멘토링을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && <MentoringView data={data} />}
    </DataBoundary>
  )
}

function MentoringView({ data }: { data: MentoringData }) {
  const toast = useToast()
  const [params] = useSearchParams()
  const noMentor = params.get('state') === 'no-mentor' || !data.mentor.assigned
  const createRequest = useCreateMentoringRequest()
  const cancelRequestMutation = useCancelMentoringRequest()
  const acceptProposalMutation = useAcceptMentoringProposal()

  // 상호작용 상태 — mutation 응답을 즉시 반영한다.
  const [current, setCurrent] = useState(data)
  const initialRequests = activeRequestsOf(data)
  const [cancelTarget, setCancelTarget] =
    useState<MentoringActiveRequest | null>(
      params.get('modal') === 'cancel-request'
        ? (initialRequests[0] ?? null)
        : null,
    )
  // 새 멘토링 요청 팝업 열림.
  const [requestModalOpen, setRequestModalOpen] = useState(false)

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
    setCurrent(next)
  }

  useEffect(() => {
    setCurrent(data)
  }, [data])

  const activeRequests = activeRequestsOf(current)
  const reservations = reservationsOf(current)
  const policy = requestPolicyOf(current, activeRequests, reservations)
  const awaitingCompletionCount = reservations.filter(
    (reservation) => reservation.phase === 'awaiting_completion',
  ).length

  // 멘토 미배정: 히어로(배정 대기)·비활성 요청만. 진행 요청/예약/기록은 숨김. 팀원은 그대로 노출.
  const display: MentoringData = noMentor
    ? {
        ...current,
        mentor: { ...current.mentor, assigned: false },
        kpis: {
          inProgress: 0,
          requestLimit: policy.limit,
          completed: 0,
          cumulativeHours: 0,
          remainingHours: 0,
        },
        activeRequest: null,
        reservation: null,
        activeRequests: [],
        reservations: [],
        requestPolicy: {
          ...policy,
          inUse: 0,
          canRequest: false,
          requestedCount: 0,
          proposedCount: 0,
          reservedCount: 0,
          blockReason: 'mentor_not_assigned',
        },
        history: [],
      }
    : {
        ...current,
        kpis: {
          ...current.kpis,
          inProgress: policy.inUse,
          requestLimit: policy.limit,
        },
        activeRequest: activeRequests[0] ?? null,
        reservation:
          reservations.find(
            (reservation) => reservation.phase !== 'awaiting_completion',
          ) ?? null,
        activeRequests,
        reservations,
        requestPolicy: policy,
      }

  const canRequest = policy.canRequest && !noMentor
  const disabledReason = noMentor
    ? '멘토 배정 후 요청할 수 있어요'
    : !policy.canRequest
      ? limitReachedReason(policy)
      : ''

  const submitRequest = (v: NewRequestValues) => {
    createRequest.mutate(v, {
      onSuccess: (next) => {
        applyMentoringData(next)
        setRequestModalOpen(false)
        toast.success(TOAST.requested.message)
      },
      onError: () => {
        toast.danger('멘토링 요청 제출에 실패했어요')
      },
    })
  }

  const cancelRequest = () => {
    if (!cancelTarget?.id) {
      setCancelTarget(null)
      return
    }
    cancelRequestMutation.mutate(cancelTarget.id, {
      onSuccess: (next) => {
        applyMentoringData(next)
        setCancelTarget(null)
        toast.warning(TOAST.canceled.message)
      },
      onError: () => {
        toast.danger('멘토링 요청 취소에 실패했어요')
      },
    })
  }

  // 제안 수락 → 멘토 제안을 확정 예약으로 전환(슬롯 점유 유지) + accepted 토스트.
  const acceptProposal = (request: MentoringActiveRequest) => {
    acceptProposalMutation.mutate(request.id, {
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
      <CourseTabs />
      <MentoringHero data={display} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* 좌: 진행 중 요청 · 확정 예약 · 멘토링 기록(+ 새 요청 버튼) */}
        <div className="flex flex-col gap-5">
          {!noMentor && (
            <MentoringProgressSummary
              policy={policy}
              awaitingCompletionCount={awaitingCompletionCount}
            />
          )}
          {(display.activeRequests ?? []).map((request) => (
            <ActiveRequestCard
              key={request.id}
              request={request}
              onCancel={() => setCancelTarget(request)}
              onReject={() => setCancelTarget(request)}
              onAccept={() => acceptProposal(request)}
            />
          ))}
          {(display.reservations ?? []).map((reservation) => (
            <ConfirmedReservationCard key={reservation.id} r={reservation} />
          ))}
          <MentoringHistorySection
            rows={display.history}
            onNewRequest={() => setRequestModalOpen(true)}
            canRequest={canRequest}
            disabledReason={disabledReason}
          />
        </div>

        {/* 우: 함께 멘토링 받는 팀원 */}
        <aside className="flex flex-col gap-5">
          <CoMenteesPanel
            teamName={display.teamName}
            mentor={display.mentor}
            members={display.teamMembers ?? []}
          />
        </aside>
      </div>

      {requestModalOpen && (
        <NewRequestModal
          open
          onClose={() => setRequestModalOpen(false)}
          isSubmitting={createRequest.isPending}
          onSubmit={submitRequest}
        />
      )}

      <CancelRequestModal
        open={!!cancelTarget}
        requester={cancelTarget?.student.person}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancelRequest}
      />
    </div>
  )
}
