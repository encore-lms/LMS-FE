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
import { LOG_SUBMITTED_TOAST } from './logMeta'

/** 일지 제출 완료 요약 — 작성 폼이 navigate state 로 전달(제출 직후 값). */
export interface LogSubmittedState {
  submittedAtLabel: string
  resubmit: boolean
  rows: { label: string; value: string }[]
  /** 어디서 왔는지 — 팀 상세에서 왔으면 그 팀으로 돌려보낸다(기본은 일지 목록). */
  backTo?: string
}

// 멘토링 일지 제출 완료 (/mentor/mentoring-logs/submitted) — Figma 2582:6348.
// 제출 직후 요약 페이지(평가/추천 제출 완료와 동일한 submitted.tsx 공통 골격 재사용).
// state 부재(직접 진입·새로고침 등)면 목록으로 복귀.
export default function LogSubmittedPage() {
  usePageHeader('멘토링 일지', MENTOR_FLOW_CAPTION)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const state = location.state as LogSubmittedState | null

  const toastShownRef = useRef(false)
  useEffect(() => {
    if (!state) {
      navigate('/mentor/teams', { replace: true })
      return
    }
    if (toastShownRef.current) return
    toastShownRef.current = true
    toast.success(LOG_SUBMITTED_TOAST)
  }, [state, navigate, toast])

  if (!state) return null

  // 팀 안에서 쓰기 시작했으면 팀으로 돌아간다 — 사이드바에서 사라진 목록으로 내보내지 않는다.
  const backTo = state.backTo ?? '/mentor/teams'
  const backLabel = state.backTo ? '팀으로 돌아가기' : '배정 팀'

  return (
    <div className="flex flex-col gap-5 p-8">
      <SuccessHero
        eyebrow="MENTORING LOG · 제출 완료"
        title={
          state.resubmit ? '일지가 재제출되었습니다' : '일지가 제출되었습니다'
        }
        description="승인 대기 상태로 접수되었습니다. 매니저 승인 후 실제 진행 시간이 인정 시간에 반영됩니다."
      />
      <SubmitSummaryCard
        submittedAtLabel={state.submittedAtLabel}
        rows={state.rows}
      />
      <NextStepBar
        secondary={{ label: backLabel, to: backTo }}
        primary={{ label: '새 일지 작성', to: '/mentor/mentoring-logs/new' }}
      />
      <InfoNotice>
        제출한 일지는 매니저 승인 대기 상태가 됩니다. 승인되면 인정 시간에
        반영되고, 매니저의 수정 요청이 있으면 전체 수정 후 재제출할 수 있습니다.
      </InfoNotice>
    </div>
  )
}
