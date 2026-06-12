import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useEvaluationSubmissions } from '../api/evaluations'
import {
  InfoNotice,
  NextStepBar,
  SubmitSummaryCard,
  SuccessHero,
} from '../components/submitted'
import { MENTOR_FLOW_CAPTION } from '../constants'
import { EVALUATION_SUBMITTED_TOAST } from './evaluationMeta'

// 평가 제출 완료 (/mentor/evaluations) — Figma 2582:6400. 헤더 타이틀은 frame 원문 '평가 작성'.
// ?teamId= 의 제출 요약을 표시(없으면 최신 제출). ?toast=submitted 는 공통 토스트 1회 표시
// 후 쿼리 제거(M3 일지 선례) — Figma 토스트 z-order 버그(본문 뒤 깔림)는 공통 토스트
// (fixed 최상위 레이어)로 정정한다.
export default function EvaluationsSubmittedPage() {
  usePageHeader('평가 작성', MENTOR_FLOW_CAPTION)
  const { data, isPending, isError, refetch } = useEvaluationSubmissions()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const toastShownRef = useRef(false)
  useEffect(() => {
    if (toastShownRef.current || searchParams.get('toast') !== 'submitted')
      return
    toastShownRef.current = true
    toast.success(EVALUATION_SUBMITTED_TOAST)
    const next = new URLSearchParams(searchParams)
    next.delete('toast')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, toast])

  if (isPending) {
    return <div className="text-fg-muted p-8">제출 요약을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="제출 요약을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const teamId = searchParams.get('teamId')
  const submission = teamId
    ? data.submissions.find((s) => s.teamId === teamId)
    : data.submissions[0]
  if (!submission) {
    return (
      <div className="p-8">
        <Empty
          icon={<Star />}
          title="제출된 평가가 없습니다"
          description="팀원 전체 평가를 최종 제출하면 여기에서 제출 요약을 확인할 수 있어요."
          action={
            <Link
              to="/mentor/teams"
              className="border-border text-fg hover:bg-surface-muted rounded-[10px] border bg-white px-4 py-2.5 text-[13px] font-bold"
            >
              내 배정 팀으로 이동
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <SuccessHero
        eyebrow="MENTOR EVALUATION · 제출 완료"
        title="평가가 제출되었습니다"
        description={`팀원 ${submission.targetCount}명 5축 점수와 줄글 평가 코멘트가 저장되었습니다. 다음 단계로 추천 선택이 활성됩니다.`}
      />
      <SubmitSummaryCard
        submittedAtLabel={submission.submittedAtLabel}
        rows={[
          {
            label: '팀',
            value: `${submission.cohortLabel} · ${submission.teamName}`,
          },
          {
            label: '평가 대상',
            value: `팀원 ${submission.targetCount}명 전체`,
          },
          {
            label: '5축 평균',
            value: submission.axisAverages
              .map((a) => `${a.label} ${a.value}`)
              .join(' · '),
          },
          { label: '코멘트', value: submission.commentsLabel },
          // Figma 원문 행 — '제출 후 수정 불가' 확정 정책과 카피 충돌(openQuestion, 표기만 유지).
          { label: '24시간 수정 마감', value: submission.editDeadlineLabel },
        ]}
      />
      {/* '평가 목록' 화면 미설계 — 팀별 평가 진입 목록 역할인 내 배정 팀으로 연결(기록). */}
      <NextStepBar
        secondary={{ label: '평가 목록', to: '/mentor/teams' }}
        primary={{
          label: '추천 선택 단계로 이동',
          to: `/mentor/teams/${submission.teamId}/recommendation`,
        }}
      />
      <InfoNotice>
        평가 미작성 상태는 해야 할 일에 노출됩니다. 추천 선택까지 최종 제출하면
        활동 인정 요건이 충족됩니다.
      </InfoNotice>
    </div>
  )
}
