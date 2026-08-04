import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Star } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
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

  const teamId = searchParams.get('teamId')
  const submission = teamId
    ? data?.submissions.find((s) => s.teamId === teamId)
    : data?.submissions[0]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="제출 요약을 불러오는 중…"
      errorTitle="제출 요약을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data &&
        (!submission ? (
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
        ) : (
          <div className="flex flex-col gap-5 p-8">
            <SuccessHero
              eyebrow="MENTOR EVALUATION · 제출 완료"
              title="평가가 제출되었습니다"
              description={`팀원 ${submission.targetCount}명 5축 점수와 줄글 평가 코멘트가 저장되었습니다. 제출 후에도 재제출로 언제든 수정할 수 있습니다.`}
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
                // 정책 완화(2026-08-04) — 상시 재제출 가능, 마지막 제출본 유효.
                {
                  label: '수정 가능 여부',
                  value: '상시 수정 가능 — 재제출 시 갱신',
                },
              ]}
            />
            {/* 팀원별 점수·코멘트 자세히 보기 = 평가 작성 화면 재진입(값 프리필). */}
            <NextStepBar
              secondary={{
                label: '평가 자세히 보기 · 수정',
                to: `/mentor/teams/${submission.teamId}/evaluation`,
              }}
              primary={{
                label: '추천 선택 단계로 이동',
                to: `/mentor/teams/${submission.teamId}/recommendation`,
              }}
            />
            <InfoNotice>
              평가 미작성 상태는 해야 할 일에 노출됩니다. 추천 선택까지 최종
              제출하면 활동 인정 요건이 충족됩니다.
            </InfoNotice>
          </div>
        ))}
    </DataBoundary>
  )
}
