import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useRecommendationSubmissions } from '../api/evaluations'
import {
  InfoNotice,
  NextStepBar,
  SubmitSummaryCard,
  SuccessHero,
} from '../components/submitted'
import { MENTOR_FLOW_CAPTION } from '../constants'
import { RECOMMENDATION_SUBMITTED_TOAST } from './recommendationMeta'

// 추천 제출 완료 (/mentor/recommendations) — Figma 2582:6476. 헤더 타이틀 원문 '추천 선택'.
// ?teamId= 의 제출 요약(없으면 최신 제출) + ?toast=submitted 공통 토스트 1회(M3 선례,
// Figma 토스트 z-order 버그는 공통 토스트 fixed 최상위로 정정).
export default function RecommendationsSubmittedPage() {
  usePageHeader('추천 선택', MENTOR_FLOW_CAPTION)
  const { data, isPending, isError, refetch } = useRecommendationSubmissions()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const toastShownRef = useRef(false)
  useEffect(() => {
    if (toastShownRef.current || searchParams.get('toast') !== 'submitted')
      return
    toastShownRef.current = true
    toast.success(RECOMMENDATION_SUBMITTED_TOAST)
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
              icon={<Flag />}
              title="제출된 추천이 없습니다"
              description="평가 제출 후 팀당 1명 추천 또는 추천 안 함을 최종 제출하면 여기에서 확인할 수 있어요."
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
              eyebrow="MENTOR RECOMMENDATION · 제출 완료"
              title="추천 선택이 제출되었습니다"
              description={
                submission.recommended
                  ? '추천 대상 1명이 저장되었습니다. 수강생에게는 추천 여부만 노출되며 원문 평가는 비공개입니다. 외부 공개는 증명서 전체 공개 토글 + 인증 완료 + 최신화 스냅샷 기준을 따릅니다.'
                  : '추천하지 않음으로 저장되었습니다. 수강생에게는 추천 여부만 노출되며 원문 평가는 비공개입니다.'
              }
            />
            <SubmitSummaryCard
              submittedAtLabel={submission.submittedAtLabel}
              rows={[
                {
                  label: '팀',
                  value: `${submission.cohortLabel} · ${submission.teamName}`,
                },
                { label: '추천 대상', value: submission.targetLabel },
                { label: '추천 사유 작성', value: submission.summaryLabel },
                { label: '증명서 반영', value: submission.certificateLabel },
                // 확정 정책(05-29·05-31: 최종 제출 후 수정 불가) 정합 — Figma '24시간 수정 마감' 행은
                // 정책 충돌 카피라 교체(Figma 동반 정정 2026-06-13).
                {
                  label: '수정 가능 여부',
                  value: '최종 제출 완료 — 수정 불가',
                },
              ]}
            />
            {/* '평가·추천 목록' = 사이드바 평가·추천 진입 화면(/mentor/evaluations)으로 연결. */}
            <NextStepBar
              secondary={{ label: '평가·추천 목록', to: '/mentor/evaluations' }}
              primary={{ label: '멘토 대시보드', to: '/mentor' }}
            />
            <InfoNotice>
              원점수와 원문 평가는 수강생에게 비공개입니다. 외부 증명서 공개는
              증명서 전체 공개 토글 + 인증 완료 + 최신화 스냅샷 조건이 충족될 때
              반영됩니다.
            </InfoNotice>
          </div>
        ))}
    </DataBoundary>
  )
}
