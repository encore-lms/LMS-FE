import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import {
  InfoNotice,
  NextStepBar,
  SubmitSummaryCard,
  SuccessHero,
} from '../components/submitted'
import { MENTOR_FLOW_CAPTION } from '../constants'
import { RESPONSE_SAVED_TOAST } from './requestMeta'

export type RequestRespondedOutcome =
  | 'confirmed'
  | 'counter'
  | 'rejected'
  | 'updated'

/** 예약 응답 완료 요약 — 응답 모달이 navigate state 로 결과를 전달. */
export interface RequestRespondedState {
  outcome: RequestRespondedOutcome
  submittedAtLabel: string
  teamLabel: string
  rows: { label: string; value: string }[]
  waitingForStudent: boolean
}

const OUTCOME_META: Record<
  RequestRespondedOutcome,
  { eyebrow: string; title: string; description: string }
> = {
  confirmed: {
    eyebrow: 'MENTOR RESERVATION · 확정',
    title: '예약을 확정했습니다',
    description:
      '희망 일정 그대로 예약이 확정되었습니다. 수강생에게 확정 알림이 전송됩니다.',
  },
  counter: {
    eyebrow: 'MENTOR RESERVATION · 조정 제안',
    title: '조정 제안을 보냈습니다',
    description: '제안한 일정으로 수강생 응답을 기다립니다.',
  },
  rejected: {
    eyebrow: 'MENTOR RESERVATION · 거절',
    title: '요청을 거절했습니다',
    description: '요청이 종료되었습니다. 거절 사유가 수강생에게 전달됩니다.',
  },
  updated: {
    eyebrow: 'MENTOR RESERVATION · 확정 정보 변경',
    title: '확정 정보를 변경했습니다',
    description:
      '변경한 확정 일정·장소가 저장되었습니다. 수강생에게 변경 알림이 전송됩니다.',
  },
}

// 예약 응답 완료 (/mentor/mentoring-requests/submitted) — Figma 2582:6296.
// 응답 모달이 navigate state 로 결과(확정/조정 제안/거절/확정 변경)를 전달.
// (평가/추천 제출 완료와 동일한 submitted.tsx 공통 골격 재사용.) state 부재 시 목록 복귀.
export default function RequestRespondedPage() {
  usePageHeader('멘토링 예약 요청', MENTOR_FLOW_CAPTION)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const state = location.state as RequestRespondedState | null

  const toastShownRef = useRef(false)
  useEffect(() => {
    if (!state) {
      navigate('/mentor/mentoring-requests', { replace: true })
      return
    }
    if (toastShownRef.current) return
    toastShownRef.current = true
    toast.success(RESPONSE_SAVED_TOAST)
  }, [state, navigate, toast])

  if (!state) return null

  const meta = OUTCOME_META[state.outcome]
  return (
    <div className="flex flex-col gap-5 p-8">
      <SuccessHero
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
      />
      <SubmitSummaryCard
        submittedAtLabel={state.submittedAtLabel}
        rows={[{ label: '팀', value: state.teamLabel }, ...state.rows]}
      />
      <NextStepBar
        secondary={{
          label: '예약 요청 목록',
          to: '/mentor/mentoring-requests',
        }}
        primary={{ label: '내 배정 팀', to: '/mentor/teams' }}
      />
      {state.waitingForStudent && (
        <InfoNotice>
          조정 제안은 수강생이 수락·거절할 때까지 대기 상태로 유지됩니다. 수강생
          응답 시 알림을 받습니다.
        </InfoNotice>
      )}
    </div>
  )
}
