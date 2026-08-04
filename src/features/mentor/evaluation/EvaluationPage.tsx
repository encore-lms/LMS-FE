import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Flag,
  Info,
  Pencil,
  Star,
  Timer,
  XCircle,
} from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import {
  useSaveEvaluationDraft,
  useSubmitEvaluation,
  useTeamEvaluation,
} from '../api/evaluations'
import { ConfirmSubmitModal } from '../components/ConfirmSubmitModal'
import { MENTOR_FLOW_CAPTION } from '../constants'
import { CharCounter } from '../mentoring-logs/LogChips'
import type {
  EvaluationScoreTuple,
  MentorEvaluationDraftEntry,
  MentorEvaluationMemberEntry,
  MentorEvaluationSheetData,
} from '../types'
import {
  AUTOSAVE_DELAY_MS,
  EVALUATION_ACTION_CAPTION,
  EVALUATION_AXES,
  EVALUATION_COMMENT_LIMIT,
  EVALUATION_COMMENT_PLACEHOLDER,
  EVALUATION_CONFIRM_BODY,
  EVALUATION_CONFIRM_EYEBROW,
  EVALUATION_CONFIRM_TITLE,
  EVALUATION_CRITERIA_CAPTION,
  EVALUATION_CRITERIA_TITLE,
  EVALUATION_NEXT_BANNER_DESC,
  EVALUATION_NEXT_BANNER_TITLE,
  memberAvatarBg,
} from './evaluationMeta'

const round1 = (n: number) => Math.round(n * 10) / 10

/** 입력 완료 — 5축 전 점수(1~5) + 줄글 코멘트(mock 검증과 동일 기준). */
const isComplete = (entry: { scores: EvaluationScoreTuple; comment: string }) =>
  entry.scores.every((s) => s != null) && entry.comment.trim().length > 0

type CardState = 'done' | 'active' | 'waiting'

// 멘토 평가 작성 (/mentor/teams/:teamId/evaluation) — Figma 2553:4279.
// 정책 완화(2026-08-04): 멘토링 시작부터 상시 작성 · 제출 후에도 재제출로 수정 가능(마지막 제출본 유효).
// 제출본은 draft 저장이 409라 자동 저장을 멈추고 '수정 재제출'만 연다(반쪽 상태 노출 방지).
// 팀원 전체 카드형 — 고정 5축(1~5 세그먼트) + 수강생별 줄글 필수, 전원 입력 시 제출 활성.
export default function EvaluationPage({
  embedded = false,
  teamId: fixedTeamId,
  onSubmitted,
}: {
  /** 팀 상세 '평가·추천' 탭에 얹을 때 — 자체 헤더·브레드크럼·바깥 여백을 생략한다. */
  embedded?: boolean
  teamId?: string
  /** 제출이 끝났을 때 — 탭 안에서는 다음 단계(추천)로 이어야 해서 페이지를 옮기지 않는다. */
  onSubmitted?: () => void
} = {}) {
  usePageHeader('평가 작성', MENTOR_FLOW_CAPTION, !embedded)
  const { teamId: paramTeamId = '' } = useParams()
  const teamId = fixedTeamId ?? paramTeamId
  const { data, isPending, isError, refetch } = useTeamEvaluation(teamId)

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="평가 정보를 불러오는 중…"
      errorTitle="평가 정보를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className={embedded ? '' : 'p-8'}
    >
      {/* 정책 완화(2026-08-04) — 상시 작성·재제출 가능이라 잠금·차단 분기 없이 항상 폼을 연다.
          제출된 평가도 값이 채워진 폼으로 열려 '자세히 보기'를 겸한다. */}
      {data && (
        <EvaluationForm
          sheet={data}
          embedded={embedded}
          onSubmitted={onSubmitted}
        />
      )}
    </DataBoundary>
  )
}

function EvaluationForm({
  sheet,
  embedded = false,
  onSubmitted,
}: {
  sheet: MentorEvaluationSheetData
  embedded?: boolean
  onSubmitted?: () => void
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const draftMutation = useSaveEvaluationDraft()
  const submitMutation = useSubmitEvaluation()
  // 제출본 편집 모드 — draft 저장은 BE가 409로 막으므로(반쪽 상태 노출 방지) 재제출만 허용.
  const submitted = sheet.status === 'submitted'
  // 계약 종료 마감 — 저장·제출 전부 잠금, 화면은 읽기 전용으로 열어 자세히 보기만 허용.
  const closed = sheet.submissionClosed

  const [entries, setEntries] = useState<MentorEvaluationDraftEntry[]>(() =>
    sheet.members.map((m) => ({
      studentId: m.studentId,
      scores: [...m.scores] as EvaluationScoreTuple,
      comment: m.comment,
    })),
  )
  const [savedLabel, setSavedLabel] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const setScore = (studentId: string, axisIndex: number, value: number) =>
    setEntries((prev) =>
      prev.map((e) =>
        e.studentId === studentId
          ? {
              ...e,
              scores: e.scores.map((s, i) =>
                i === axisIndex ? value : s,
              ) as EvaluationScoreTuple,
            }
          : e,
      ),
    )

  const setComment = (studentId: string, comment: string) =>
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, comment } : e)),
    )

  const doneCount = entries.filter(isComplete).length
  const missingCount = entries.length - doneCount
  const canSubmit = missingCount === 0
  const firstIncomplete = entries.findIndex((e) => !isComplete(e))
  const cardStateOf = (index: number): CardState =>
    isComplete(entries[index])
      ? 'done'
      : index === firstIncomplete
        ? 'active'
        : 'waiting'

  // 자동 저장 — 입력 멈춤 디바운스(주기·트리거 미확정 openQuestion, '자동 저장 · 방금' 칩 갱신).
  const autosaveRef = useRef(() => {})
  autosaveRef.current = () => {
    draftMutation.mutate(
      { teamId: sheet.teamId, payload: { entries } },
      { onSuccess: () => setSavedLabel('방금') },
    )
  }
  const skipFirstAutosave = useRef(true)
  useEffect(() => {
    if (skipFirstAutosave.current) {
      skipFirstAutosave.current = false
      return
    }
    if (submitted || closed) return
    const timer = setTimeout(() => autosaveRef.current(), AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [entries, submitted, closed])

  // 임시 저장 — 수동 버튼(자동 저장과 동일 draft endpoint, 토스트 안내만 추가).
  const onSaveDraft = () => {
    draftMutation.mutate(
      { teamId: sheet.teamId, payload: { entries } },
      {
        onSuccess: () => {
          setSavedLabel('방금')
          toast.success(
            '평가 초안을 임시 저장했어요. 제출 전까지 자유롭게 수정할 수 있습니다.',
          )
        },
        onError: () =>
          toast.danger('임시 저장에 실패했어요. 잠시 후 다시 시도해 주세요.'),
      },
    )
  }

  // 최종 제출 — 확인 모달 통과 후에만(제출 후 수정 불가) → 완료 페이지 + 공통 토스트.
  const onConfirmSubmit = async () => {
    try {
      await submitMutation.mutateAsync({
        teamId: sheet.teamId,
        payload: { entries },
      })
      // 탭 안에서는 화면을 옮기지 않는다 — 바로 다음 단계(추천 선택)로 이어진다.
      if (embedded) onSubmitted?.()
      else
        navigate(`/mentor/evaluations?teamId=${sheet.teamId}&toast=submitted`)
    } catch {
      setConfirmOpen(false)
      toast.danger('평가 제출에 실패했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  const saving = draftMutation.isPending || submitMutation.isPending
  const teamLabel = `${sheet.cohortLabel} · ${sheet.teamName}`

  return (
    <div className={cn('flex flex-col gap-5', !embedded && 'p-8')}>
      {/* 브레드크럼 + 자동 저장 칩 — 탭 안에서는 이미 팀 안이라 길잡이가 필요 없다. */}
      <div className="flex flex-wrap items-center gap-2">
        {!embedded && (
          <>
            <Link
              to={`/mentor/teams/${sheet.teamId}`}
              className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-2.5 py-[5px] text-xs font-medium"
            >
              <ArrowLeft className="h-3 w-3" />팀 상세
            </Link>
            <span className="text-fg-subtle text-[13px]">›</span>
            <span className="text-fg-subtle text-[13px]">{teamLabel}</span>
            <span className="text-fg-subtle text-[13px]">›</span>
            <span className="text-fg text-xs font-medium">평가 작성</span>
          </>
        )}
        <span className="bg-surface-muted text-fg-muted ml-auto flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium">
          <Pencil className="h-3 w-3" />
          {closed
            ? `제출 마감 — 계약 종료 (${sheet.submissionDeadlineLabel ?? ''})`
            : submitted
              ? `제출됨 · ${sheet.submittedAtLabel ?? ''} — 수정 후 재제출`
              : savedLabel
                ? `자동 저장 · ${savedLabel}`
                : '저장 전 — 자동 저장 대기'}
        </span>
      </div>

      {/* Hero — brand 배너 + 진행률 필 */}
      <section className="bg-brand text-on-color flex flex-wrap items-center justify-between gap-4 rounded-2xl px-7 py-[22px] shadow-[0_8px_22px_rgba(26,140,133,0.18)]">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-[1.98px]">
            MENTOR EVALUATION · 5축 평가
          </span>
          <h2 className="text-[22px] leading-7 font-bold">
            {sheet.teamName} {sheet.memberCount}명 카드형 일괄 평가
          </h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-surface text-success flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold">
              <Check className="h-[11px] w-[11px]" />
              {sheet.eligibleLabel}
            </span>
            <span className="text-xs font-medium">
              {teamLabel} · 인정 {sheet.recognizedHours}h / 배정{' '}
              {sheet.allocatedHours}h
              {sheet.submissionDeadlineLabel &&
                ` · 제출 마감 ${sheet.submissionDeadlineLabel}`}
            </span>
          </div>
        </div>
        <div className="bg-surface text-fg flex flex-col items-center gap-0.5 rounded-[10px] px-3.5 py-2.5">
          <span className="text-fg-subtle text-[10px] font-medium tracking-[0.8px]">
            진행률
          </span>
          <span className="text-sm font-bold">
            {doneCount} / {sheet.memberCount}명
          </span>
        </div>
      </section>

      {/* 평가 기준 — 5축 고정 칩 */}
      <section className="bg-surface flex flex-col gap-3 rounded-2xl p-5 shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="text-fg h-4 w-4" />
            <h3 className="text-fg text-sm font-bold">
              {EVALUATION_CRITERIA_TITLE}
            </h3>
          </div>
          <span className="text-fg-subtle text-[11px] font-medium">
            {EVALUATION_CRITERIA_CAPTION}
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {EVALUATION_AXES.map((axis) => {
            const Icon = axis.icon
            return (
              <div
                key={axis.label}
                className={cn(
                  'flex flex-1 basis-40 items-center gap-2.5 rounded-[10px] px-3.5 py-2.5',
                  axis.tint,
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', axis.text)} />
                <div className="flex flex-col">
                  <span className={cn('text-[13px] font-bold', axis.text)}>
                    {axis.label}
                  </span>
                  <span className="text-fg-muted text-[10px]">{axis.desc}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 팀원 평가 카드 — 순차 작성 시각 상태(자유 편집 허용, 순서 강제 없음 openQuestion) */}
      {sheet.members.map((member, index) => (
        <MemberEvalCard
          key={member.studentId}
          member={member}
          index={index}
          entry={entries[index]}
          state={cardStateOf(index)}
          readOnly={closed}
          onScore={setScore}
          onComment={setComment}
        />
      ))}

      {/* 다음 단계 안내 — accent 틴트(#f0edfa→accent-bg) */}
      <section className="bg-accent-bg border-accent-strong flex items-center gap-3.5 rounded-2xl border p-[18px]">
        <span className="bg-surface text-accent-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <Flag className="h-[22px] w-[22px]" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-sm font-bold">
            {EVALUATION_NEXT_BANNER_TITLE}
          </span>
          <span className="text-fg-muted text-xs leading-[18px]">
            {EVALUATION_NEXT_BANNER_DESC}
          </span>
        </div>
      </section>

      {/* 하단 액션바 — brand-deep */}
      <section className="bg-brand-deep text-on-color flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-[18px] shadow-[0_8px_24px_rgba(18,23,38,0.18)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold">
            평가 작성 {doneCount} / {sheet.memberCount}명 · 5축 모든 점수 필수
          </span>
          <span className="text-on-color/70 text-[11px]">
            {EVALUATION_ACTION_CAPTION}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {/* 제출본은 draft 저장이 409 — 임시 저장 대신 재제출만 연다. 마감 시 전부 잠금. */}
          {!submitted && !closed && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={saving}
              className="border-on-color/70 text-on-color hover:bg-on-color/10 rounded-[10px] border px-4 py-2.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              임시 저장
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={closed || !canSubmit || saving}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] px-[18px] py-2.5 text-[13px] font-bold',
              !closed && canSubmit
                ? 'bg-brand text-on-color hover:bg-brand/90'
                : 'bg-fg-subtle text-on-color cursor-not-allowed',
            )}
          >
            {closed ? (
              <>
                <XCircle className="h-3.5 w-3.5" />
                제출 마감 — 계약 종료
              </>
            ) : canSubmit ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {submitted ? '수정 재제출' : '평가 제출'}
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                제출 불가 ({missingCount}명 평가 필요)
              </>
            )}
          </button>
        </div>
      </section>

      <ConfirmSubmitModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmSubmit}
        eyebrow={EVALUATION_CONFIRM_EYEBROW}
        title={EVALUATION_CONFIRM_TITLE}
        body={EVALUATION_CONFIRM_BODY}
        pending={submitMutation.isPending}
      />
    </div>
  )
}

const CARD_STATE_META: Record<
  CardState,
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

function MemberEvalCard({
  member,
  index,
  entry,
  state,
  readOnly = false,
  onScore,
  onComment,
}: {
  member: MentorEvaluationMemberEntry
  index: number
  entry: MentorEvaluationDraftEntry
  state: CardState
  /** 계약 종료 마감 — 점수·코멘트 입력 잠금(자세히 보기 전용). */
  readOnly?: boolean
  onScore: (studentId: string, axisIndex: number, value: number) => void
  onComment: (studentId: string, comment: string) => void
}) {
  const meta = CARD_STATE_META[state]
  const PillIcon = meta.icon
  const complete = state === 'done'
  const average = complete
    ? round1(
        entry.scores.reduce<number>((sum, s) => sum + (s ?? 0), 0) /
          entry.scores.length,
      )
    : null
  const roleLabel = member.tagLabel ?? (member.role === 'pm' ? 'PM' : '팀원')

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
            {member.name.charAt(0)}
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-fg text-base font-bold">{member.name}</span>
              <span
                className={cn(
                  'rounded-[5px] px-[7px] py-0.5 text-[10px] font-bold',
                  member.role === 'pm'
                    ? 'bg-accent-strong text-on-color'
                    : 'bg-surface-muted text-fg-subtle',
                )}
              >
                {roleLabel}
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
                <span className="bg-border h-3 w-px" aria-hidden />
                <span className="text-success text-[11px] font-medium">
                  코멘트 작성됨
                </span>
              </div>
            ) : state === 'active' ? (
              <span className="text-fg-muted text-[11px]">
                점수 입력 + 줄글 평가 작성
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
        {EVALUATION_AXES.map((axis, axisIndex) => {
          const Icon = axis.icon
          const score = entry.scores[axisIndex]
          return (
            <div key={axis.label} className="flex items-center gap-3.5">
              <span className="flex w-[140px] shrink-0 items-center gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-md',
                    axis.tint,
                  )}
                >
                  <Icon className={cn('h-3 w-3', axis.text)} />
                </span>
                <span className="text-fg text-[13px] font-bold">
                  {axis.label}
                </span>
              </span>
              <div
                role="radiogroup"
                aria-label={`${member.name} ${axis.label} 점수`}
                className="flex flex-1 gap-1.5"
              >
                {[1, 2, 3, 4, 5].map((value) => {
                  const selected = score != null && value <= score
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={score === value}
                      aria-label={`${value}점`}
                      disabled={readOnly}
                      onClick={() =>
                        onScore(member.studentId, axisIndex, value)
                      }
                      className={cn(
                        'flex h-9 flex-1 items-center justify-center rounded-lg',
                        selected
                          ? axis.fill
                          : 'bg-surface-muted border-border hover:bg-divider border',
                      )}
                    >
                      <Star
                        className={cn(
                          'h-3.5 w-3.5',
                          selected
                            ? 'text-on-color fill-current'
                            : 'text-fg-subtle',
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
        {/* 줄글 평가 코멘트 — 수강생별 필수(미입력 시 제출 차단) */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={`eval-comment-${member.studentId}`}
              className="text-fg-subtle text-[11px] font-medium"
            >
              줄글 평가 코멘트
            </label>
            <span className="bg-surface-muted text-fg-subtle rounded px-[5px] py-px text-[9px] font-medium">
              필수
            </span>
            <span className="ml-auto">
              <CharCounter
                length={entry.comment.length}
                limit={EVALUATION_COMMENT_LIMIT}
              />
            </span>
          </div>
          <textarea
            id={`eval-comment-${member.studentId}`}
            value={entry.comment}
            maxLength={EVALUATION_COMMENT_LIMIT}
            readOnly={readOnly}
            onChange={(e) => onComment(member.studentId, e.target.value)}
            placeholder={EVALUATION_COMMENT_PLACEHOLDER}
            rows={3}
            className={cn(
              'text-fg placeholder:text-fg-subtle w-full resize-y rounded-lg px-3.5 py-2.5 text-[13px] leading-5 outline-none',
              state === 'active'
                ? 'border-brand border-[1.5px]'
                : 'border-border focus:border-brand border',
            )}
          />
        </div>
      </div>
    </section>
  )
}
