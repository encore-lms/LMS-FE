import { Check, Pencil, Timer } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { CharCounter } from '@/components/ui/CharCounter'
import {
  EVALUATION_AXES,
  LIKERT_ANCHORS,
  LIKERT_SIZES,
  memberAvatarBg,
} from './evalAxes'

// 팀원 4축 평가 카드 — 멘토 평가(EvaluationPage)에서 승격(2026-08-06).
// 멘토 평가·프로젝트 상호평가가 같은 카드를 쓴다(리커트 그리드 + 줄글 코멘트).
// 점수 완료 판정·카드 상태(state)는 화면이 정한다 — 코멘트 필수 여부가 화면마다 달라서다.

export type EvalCardState = 'done' | 'active' | 'waiting'

const CARD_STATE_META: Record<
  EvalCardState,
  { pill: string; pillClass: string; icon: typeof Check }
> = {
  done: { pill: '완료', pillClass: 'bg-success-bg text-success', icon: Check },
  active: {
    pill: '작성 중',
    pillClass: 'bg-brand/10 text-brand',
    icon: Pencil,
  },
  waiting: {
    pill: '대기',
    pillClass: 'bg-surface-muted text-fg-subtle',
    icon: Timer,
  },
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function MemberEvalCard({
  person,
  index,
  scores,
  comment,
  state,
  readOnly = false,
  commentRequired = true,
  commentLimit = 500,
  commentPlaceholder,
  onScore,
  onComment,
  footer,
}: {
  person: {
    id: string
    name: string
    roleLabel: string
    roleEmphasis?: boolean
  }
  /** 카드 순번 — 아바타 색 순환에 쓴다. */
  index: number
  /** 4축 점수(축 순서 = EVALUATION_AXES), 미입력 null. */
  scores: readonly (number | null)[]
  comment: string
  state: EvalCardState
  /** 마감 등 잠금 — 점수·코멘트 입력 잠금(자세히 보기 전용). */
  readOnly?: boolean
  /** 줄글 코멘트 필수 여부 — 멘토 평가 true, 상호평가 false(선택). */
  commentRequired?: boolean
  commentLimit?: number
  commentPlaceholder?: string
  onScore: (axisIndex: number, value: number) => void
  onComment: (comment: string) => void
  /** 카드 하단 슬롯 — 개별 저장 버튼 등 화면별 액션(수강생 평가 탭). */
  footer?: React.ReactNode
}) {
  const meta = CARD_STATE_META[state]
  const PillIcon = meta.icon
  const complete = state === 'done'
  const filled = scores.filter((s): s is number => s != null)
  const average =
    complete && filled.length > 0
      ? round1(filled.reduce((sum, s) => sum + s, 0) / filled.length)
      : null

  return (
    <section
      className={cn(
        'bg-surface rounded-2xl shadow-[0_2px_8px_rgba(18,23,38,0.04)]',
        state === 'active'
          ? 'border-brand border-[1.5px]'
          : 'border-border border',
      )}
    >
      <header className="flex items-center justify-between gap-3 px-5 pt-[18px] pb-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-on-color flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold',
              memberAvatarBg(index),
            )}
            aria-hidden
          >
            {person.name.charAt(0)}
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-fg text-base font-bold">{person.name}</span>
              <span
                className={cn(
                  'rounded-[5px] px-[7px] py-0.5 text-[10px] font-bold',
                  person.roleEmphasis
                    ? 'bg-accent-strong text-on-color'
                    : 'bg-surface-muted text-fg-subtle',
                )}
              >
                {person.roleLabel}
              </span>
            </div>
            {complete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-fg-subtle text-[11px] font-medium">
                  평균
                </span>
                <span className="text-success text-sm font-bold">
                  {average}
                </span>
                <span className="text-fg-subtle text-[10px] font-medium">
                  / 5.0
                </span>
                {comment.trim().length > 0 && (
                  <>
                    <span className="bg-border h-3 w-px" aria-hidden />
                    <span className="text-success text-[11px] font-medium">
                      코멘트 작성됨
                    </span>
                  </>
                )}
              </div>
            ) : state === 'active' ? (
              <span className="text-fg-muted text-[11px]">
                {commentRequired
                  ? '점수 입력 + 줄글 평가 작성'
                  : '4축 점수 입력 (코멘트 선택)'}
              </span>
            ) : (
              <span className="text-fg-subtle text-[11px]">
                대기 중 — 위에서 순차 작성
              </span>
            )}
          </div>
        </div>
        <span
          className={cn(
            'flex items-center gap-1 rounded-lg px-2.5 py-[5px] text-[11px] font-bold whitespace-nowrap',
            meta.pillClass,
          )}
        >
          <PillIcon className="h-[11px] w-[11px]" />
          {meta.pill}
        </span>
      </header>
      <div className="bg-divider h-px" aria-hidden />
      <div className="flex flex-col gap-3 px-5 py-4">
        {/* 리커트 앵커 헤더 — 라디오와 같은 5열 그리드, 1·3·5열(양끝·중앙) 원 바로 위에 정렬. */}
        <div className="flex items-center gap-3.5">
          <span className="w-[190px] shrink-0" aria-hidden />
          <div className="flex flex-1 items-center">
            <span className="text-fg-subtle flex-1 text-center text-[11px] font-semibold">
              {LIKERT_ANCHORS[0]}
            </span>
            <span className="flex-1" aria-hidden />
            <span className="text-fg-subtle flex-1 text-center text-[11px] font-semibold">
              {LIKERT_ANCHORS[1]}
            </span>
            <span className="flex-1" aria-hidden />
            <span className="text-fg-subtle flex-1 text-center text-[11px] font-semibold">
              {LIKERT_ANCHORS[2]}
            </span>
          </div>
          <span className="w-[60px] shrink-0" aria-hidden />
        </div>
        {EVALUATION_AXES.map((axis, axisIndex) => {
          const Icon = axis.icon
          const score = scores[axisIndex]
          return (
            <div key={axis.label} className="flex items-center gap-3.5">
              <span className="flex w-[190px] shrink-0 items-start gap-2">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                    axis.tint,
                  )}
                >
                  <Icon className={cn('h-3 w-3', axis.text)} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-fg text-[13px] font-bold">
                    {axis.label}
                  </span>
                  {/* 진술문 — 사람이 아니라 행동에 답하게 한다(인성검사식). */}
                  <span className="text-fg-subtle text-[11px]">
                    {axis.desc}
                  </span>
                </span>
              </span>
              <div
                role="radiogroup"
                aria-label={`${person.name} ${axis.label} 점수`}
                className="flex flex-1 items-center"
              >
                {[1, 2, 3, 4, 5].map((value, i) => {
                  const selected = score === value
                  return (
                    // 셀 전체가 클릭 영역 — 작은 원만 노리지 않아도 된다(호버 시 원이 반응).
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${value}점`}
                      disabled={readOnly}
                      onClick={() => onScore(axisIndex, value)}
                      className={cn(
                        'group flex h-11 flex-1 items-center justify-center',
                        readOnly ? 'cursor-default' : 'cursor-pointer',
                      )}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: LIKERT_SIZES[i],
                          height: LIKERT_SIZES[i],
                        }}
                        className={cn(
                          'rounded-full border-2 transition-all',
                          selected
                            ? cn(axis.fill, 'border-transparent')
                            : cn(
                                'border-border bg-surface',
                                !readOnly &&
                                  'group-hover:border-brand/70 group-hover:scale-110',
                              ),
                        )}
                      />
                    </button>
                  )
                })}
              </div>
              <span className="flex w-[60px] shrink-0 items-baseline justify-end gap-1">
                <span
                  className={cn(
                    'text-lg font-bold',
                    score != null ? 'text-fg' : 'text-fg-subtle',
                  )}
                >
                  {score ?? '-'}
                </span>
                <span className="text-fg-subtle text-[11px] font-medium">
                  / 5
                </span>
              </span>
            </div>
          )
        })}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={`eval-comment-${person.id}`}
              className="text-fg-subtle text-[11px] font-medium"
            >
              줄글 평가 코멘트
            </label>
            <span className="bg-surface-muted text-fg-subtle rounded px-[5px] py-px text-[9px] font-medium">
              {commentRequired ? '필수' : '선택'}
            </span>
            <span className="ml-auto">
              <CharCounter length={comment.length} limit={commentLimit} />
            </span>
          </div>
          <textarea
            id={`eval-comment-${person.id}`}
            value={comment}
            maxLength={commentLimit}
            readOnly={readOnly}
            onChange={(e) => onComment(e.target.value)}
            placeholder={commentPlaceholder}
            rows={3}
            className={cn(
              'text-fg placeholder:text-fg-subtle w-full resize-y rounded-lg px-3.5 py-2.5 text-[13px] leading-5 outline-none',
              state === 'active'
                ? 'border-brand border-[1.5px]'
                : 'border-border focus:border-brand border',
            )}
          />
        </div>
        {footer}
      </div>
    </section>
  )
}
