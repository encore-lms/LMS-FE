import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useMentorEvaluationDetail } from './api'

// 추천 단계 상태 배지.
const REC_META: Record<
  'recommended' | 'not_recommended' | 'pending',
  { label: string; tone: BadgeTone }
> = {
  recommended: { label: '추천', tone: 'success' },
  not_recommended: { label: '추천 안 함', tone: 'neutral' },
  pending: { label: '추천 대기', tone: 'neutral' },
}

/**
 * 평판 상세 모달의 멘토 평가 내용 — 5축 점수·줄글 코멘트·추천 사유(매니저 열람).
 * 멘토가 실제 입력한 값을 서버에서 조회한다. 팀 미소속·미제출이면 그 상태를 그대로 안내한다.
 */
export function MentorEvaluationDetail({ studentId }: { studentId: string }) {
  const { data, isPending, isError } = useMentorEvaluationDetail(studentId)

  if (isPending) {
    return (
      <div className="border-border bg-surface-muted h-24 animate-pulse rounded-xl border" />
    )
  }
  if (isError || !data) {
    return (
      <p className="text-fg-subtle text-xs">
        멘토 평가 내용을 불러오지 못했어요.
      </p>
    )
  }

  if (!data.hasTeam) {
    return (
      <div className="border-border rounded-xl border p-4">
        <p className="text-fg-muted text-sm font-semibold">멘토 평가</p>
        <p className="text-fg-subtle mt-1 text-xs">
          멘토링 팀에 배정되지 않아 평가 대상이 아니에요.
        </p>
      </div>
    )
  }

  if (!data.evaluationSubmitted) {
    return (
      <div className="border-border rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <p className="text-fg-muted text-sm font-semibold">멘토 평가</p>
          <span className="text-fg-subtle text-xs">
            {data.mentorName ?? '담당 멘토'} · {data.teamName}
          </span>
        </div>
        <p className="text-fg-subtle mt-1 text-xs">
          아직 멘토가 평가를 최종 제출하지 않았어요.
        </p>
      </div>
    )
  }

  return (
    <div className="border-border flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <p className="text-fg-muted text-sm font-semibold">멘토 평가 내용</p>
        <span className="text-fg-subtle text-xs">
          {data.mentorName ?? '담당 멘토'} · {data.teamName}
        </span>
      </div>

      {/* 5축 점수 */}
      <div className="grid grid-cols-5 gap-2">
        {data.axes.map((a) => (
          <div
            key={a.label}
            className="bg-surface-muted flex flex-col items-center gap-0.5 rounded-lg py-2"
          >
            <span className="text-fg-subtle text-[11px]">{a.label}</span>
            <span className="text-fg text-[15px] font-bold tabular-nums">
              {a.value ?? '-'}
            </span>
          </div>
        ))}
      </div>

      {/* 줄글 코멘트 */}
      {data.comment && (
        <div>
          <p className="text-fg-subtle mb-1 text-[11px] font-semibold">
            멘토 코멘트
          </p>
          <p className="text-fg bg-surface-muted rounded-lg p-3 text-[13px] whitespace-pre-wrap">
            {data.comment}
          </p>
        </div>
      )}

      {/* 추천 여부·사유 */}
      <div className="border-border flex flex-col gap-2 border-t pt-3">
        <div className="flex items-center gap-2">
          <span className="text-fg-muted text-[13px]">추천</span>
          <StatusBadge
            label={REC_META[data.recommendation].label}
            tone={REC_META[data.recommendation].tone}
          />
        </div>
        {data.recommendation === 'recommended' &&
          data.recommendationSummary && (
            <p className="text-fg bg-success-bg rounded-lg p-3 text-[13px] whitespace-pre-wrap">
              {data.recommendationSummary}
            </p>
          )}
      </div>
    </div>
  )
}
