import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Pencil,
  Star,
  XCircle,
} from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import {
  useSaveRecommendationDraft,
  useSubmitRecommendation,
  useTeamRecommendation,
} from '../api/evaluations'
import { ConfirmSubmitModal } from '../components/ConfirmSubmitModal'
import {
  AUTOSAVE_DELAY_MS,
  EVALUATION_AXES,
  memberAvatarBg,
} from '../evaluation/evaluationMeta'
import { CharCounter, RequiredChip } from '../mentoring-logs/LogChips'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import type {
  MentorRecommendationCandidate,
  MentorRecommendationMode,
  MentorRecommendationSheetData,
} from '../types'
import {
  RECOMMENDATION_ACTION_CAPTION,
  RECOMMENDATION_CONFIRM_BODY,
  RECOMMENDATION_CONFIRM_EYEBROW,
  RECOMMENDATION_CONFIRM_TITLE,
  RECOMMENDATION_MEMBER_SECTION_CAPTION,
  RECOMMENDATION_MODE_CARDS,
  RECOMMENDATION_POLICY_ITEMS,
  RECOMMENDATION_SUMMARY_LIMIT,
  RECOMMENDATION_SUMMARY_SUBTITLE,
} from './recommendationMeta'

// 멘토 추천 선택 (/mentor/teams/:teamId/recommendation) — Figma 2553:4425.
// 정책 완화(2026-08-04): 평가 선행 게이트 제거 — 멘토링 시작부터 평가와 독립적으로 상시 작성,
// 제출 후에도 재제출로 수정 가능(마지막 제출본 유효). 제출본은 draft 저장이 409라
// 자동 저장을 멈추고 '수정 재제출'만 연다. 팀당 1명 라디오 또는 '추천 안 함' 명시 선택 ·
// 추천 시 증명서용 간략 요약 필수 · 최종 제출 확인 모달.
export default function RecommendationPage({
  teamId: fixedTeamId,
  onSubmitted,
  onBack,
}: {
  teamId?: string
  /** 제출이 끝났을 때 — 탭 안에서는 완료 안내로 이어야 해서 페이지를 옮기지 않는다. */
  onSubmitted?: () => void
  /** 앞 단계(평가)로 되돌아가기 — 탭 안에서만 쓴다. */
  onBack?: () => void
} = {}) {
  const { teamId: paramTeamId = '' } = useParams()
  const teamId = fixedTeamId ?? paramTeamId
  const { data, isPending, isError, refetch } = useTeamRecommendation(teamId)

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonListPage kpis={3} columns={4} className="" />}
      errorTitle="추천 정보를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
    >
      {/* 정책 완화(2026-08-04) — 잠금·차단 분기 없이 항상 폼. 제출본도 값 채워진 폼으로 열린다. */}
      {data && (
        <RecommendationForm
          sheet={data}
          onSubmitted={onSubmitted}
          onBack={onBack}
        />
      )}
    </DataBoundary>
  )
}

function RecommendationForm({
  sheet,
  onSubmitted,
  onBack,
}: {
  sheet: MentorRecommendationSheetData
  onSubmitted?: () => void
  onBack?: () => void
}) {
  const toast = useToast()
  const draftMutation = useSaveRecommendationDraft()
  const submitMutation = useSubmitRecommendation()
  // 제출본 편집 모드 — draft 저장은 BE가 409로 막으므로(반쪽 상태 노출 방지) 재제출만 허용.
  const submitted =
    sheet.status === 'submitted_recommended' ||
    sheet.status === 'submitted_not_recommended'
  // 계약 종료 마감 — 저장·제출 전부 잠금, 화면은 읽기 전용으로 열어 자세히 보기만 허용.
  const closed = sheet.submissionClosed

  const [mode, setMode] = useState<MentorRecommendationMode | null>(
    sheet.draft.mode,
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    sheet.draft.studentId,
  )
  const [summary, setSummary] = useState(sheet.draft.summary)
  // 추천 알림은 발송하지 않기로 했다(2026-08-04) — 화면에서 토글을 걷어내고 늘 꺼서 보낸다.
  // BE 계약에 필드가 남아 있어 값 자체는 계속 실어 보낸다.
  const notify = false
  const [savedLabel, setSavedLabel] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selected = useMemo(
    () => sheet.candidates.find((c) => c.studentId === selectedId) ?? null,
    [sheet.candidates, selectedId],
  )
  const recommendMode = mode === 'recommend'
  const summaryDone = summary.trim().length > 0
  const canSubmit =
    mode === 'none' || (recommendMode && !!selected && summaryDone)

  const payload = useMemo(
    () => ({
      mode,
      studentId: mode === 'none' ? null : selectedId,
      summary,
      notify,
    }),
    [mode, selectedId, summary, notify],
  )

  // 자동 저장 — 입력 멈춤 디바운스(평가 작성과 동일 패턴, '자동 저장 · 방금' 칩).
  const autosaveRef = useRef(() => {})
  autosaveRef.current = () => {
    draftMutation.mutate(
      { teamId: sheet.teamId, payload },
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
  }, [payload, submitted, closed])

  const onConfirmSubmit = async () => {
    try {
      await submitMutation.mutateAsync({ teamId: sheet.teamId, payload })
      // 팀 상세 탭 안에서만 쓰인다 — 화면을 옮기지 않고 바로 완료 안내로 이어진다.
      onSubmitted?.()
    } catch {
      setConfirmOpen(false)
      toast.danger('추천 제출에 실패했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  // 액션바 좌측 상태 요약 — Figma 는 완료 상태 카피만 정의(중간 상태는 파생 카피).
  const actionTitle =
    mode === 'none'
      ? '추천하지 않음 · 사유 입력 없이 제출'
      : !mode
        ? '추천 모드를 선택하세요'
        : !selected
          ? '추천할 팀원을 선택하세요 (팀당 1명)'
          : summaryDone
            ? `${selected.name} 님 추천 · 증명서용 요약 ${summary.length}자 작성 완료`
            : `${selected.name} 님 추천 · 증명서용 간략 요약 필수`

  return (
    <div className="flex flex-col gap-5">
      {/* 브레드크럼 + 자동 저장 칩 — 탭 안에서는 앞 단계로 돌아가는 버튼만 남긴다. */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-2.5 py-[5px] text-xs font-medium"
        >
          <ArrowLeft className="h-3 w-3" />
          평가 다시 보기
        </button>
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

      {/* Hero */}
      <section className="bg-brand text-on-color flex flex-wrap items-center justify-between gap-4 rounded-2xl px-7 py-[22px] shadow-[0_8px_22px_rgba(26,140,133,0.18)]">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-[1.98px]">
            MENTOR RECOMMENDATION · 팀당 1명
          </span>
          <h2 className="text-[22px] leading-7 font-bold">
            추천 선택 — {sheet.teamName}
          </h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-surface text-success flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold">
              <Check className="h-[11px] w-[11px]" />
              상시 추천 가능 · 평가와 독립
            </span>
            <span className="text-xs font-medium">
              {sheet.cohortLabel} · {sheet.memberCount}명 평가 평균{' '}
              {sheet.teamAverage ?? '-'} / 5.0
              {sheet.submissionDeadlineLabel &&
                ` · 제출 마감 ${sheet.submissionDeadlineLabel}`}
            </span>
          </div>
        </div>
        <div className="bg-surface text-fg flex flex-col items-center gap-0.5 rounded-[10px] px-3.5 py-2.5">
          <span className="text-fg-subtle text-[10px] font-medium tracking-[0.8px]">
            필수
          </span>
          <span className="text-sm font-bold">1명</span>
        </div>
      </section>

      {/* 추천 정책 — info 틴트 4열 */}
      <section className="bg-info-bg border-info flex flex-wrap items-center gap-3.5 rounded-2xl border p-[18px]">
        <span className="bg-surface text-info flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <Info className="h-[22px] w-[22px]" />
        </span>
        <span className="text-fg text-sm font-bold">추천 정책</span>
        <div className="flex flex-1 flex-wrap items-center gap-x-[18px] gap-y-2">
          {RECOMMENDATION_POLICY_ITEMS.map((item) => (
            <div key={item.label} className="flex min-w-0 flex-col gap-0.5">
              <span className="text-fg-subtle text-[10px] font-medium tracking-[0.6px]">
                {item.label}
              </span>
              <span className="text-fg text-xs font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 추천 모드 선택 — 상호배타 라디오 카드 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2.5">
          <h3 className="text-fg text-lg font-bold">추천 모드 선택</h3>
          <span className="text-fg-subtle text-[11px]">
            추천 또는 추천 안 함 중 하나만 선택할 수 있습니다
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="추천 모드"
          className="flex flex-wrap gap-3.5"
        >
          <ModeCard
            selected={mode === 'recommend'}
            disabled={closed}
            onSelect={() => setMode('recommend')}
            icon={<Star className="h-6 w-6" />}
            title={RECOMMENDATION_MODE_CARDS.recommend.title}
            desc={RECOMMENDATION_MODE_CARDS.recommend.desc}
          />
          <ModeCard
            selected={mode === 'none'}
            disabled={closed}
            onSelect={() => setMode('none')}
            icon={<XCircle className="h-6 w-6" />}
            title={RECOMMENDATION_MODE_CARDS.none.title}
            desc={RECOMMENDATION_MODE_CARDS.none.desc}
          />
        </div>
      </div>

      {/* 추천할 팀원 선택 — 모드 '추천 안 함'이면 비활성(상태 디자인 부재 openQuestion — dim 처리) */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-fg text-lg font-bold">추천할 팀원 선택</h3>
            <span className="text-fg-subtle text-[11px]">
              {RECOMMENDATION_MEMBER_SECTION_CAPTION}
            </span>
          </div>
          <span className="bg-brand/10 text-brand rounded-md px-2.5 py-1 text-xs font-bold">
            선택 {recommendMode && selected ? 1 : 0} / 1
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="추천할 팀원"
          className={cn(
            'grid grid-cols-2 gap-3.5 lg:grid-cols-5',
            !recommendMode && 'pointer-events-none opacity-50',
          )}
        >
          {sheet.candidates.map((candidate, index) => (
            <CandidateCard
              key={candidate.studentId}
              candidate={candidate}
              index={index}
              selected={recommendMode && selectedId === candidate.studentId}
              disabled={!recommendMode || closed}
              onSelect={() => setSelectedId(candidate.studentId)}
            />
          ))}
        </div>
      </div>

      {/* 증명서용 간략 요약 — 추천 모드 + 대상 선택 시 필수 입력 */}
      {recommendMode && selected && (
        <section className="border-brand bg-surface flex flex-col gap-3 rounded-2xl border-[1.5px] p-[22px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                'text-on-color flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
                memberAvatarBg(
                  sheet.candidates.findIndex(
                    (c) => c.studentId === selected.studentId,
                  ),
                ),
              )}
              aria-hidden
            >
              {selected.name.charAt(0)}
            </span>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-fg text-[15px] font-bold">
                  {selected.name} 님 증명서용 간략 요약
                </span>
                <RequiredChip required />
              </div>
              <span className="text-fg-muted text-[11px]">
                {RECOMMENDATION_SUMMARY_SUBTITLE}
              </span>
            </div>
            <span className="ml-auto">
              <CharCounter
                length={summary.length}
                limit={RECOMMENDATION_SUMMARY_LIMIT}
              />
            </span>
          </div>
          <textarea
            aria-label="증명서용 간략 요약"
            value={summary}
            maxLength={RECOMMENDATION_SUMMARY_LIMIT}
            readOnly={closed}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={RECOMMENDATION_SUMMARY_SUBTITLE}
            className="border-brand text-fg placeholder:text-fg-subtle h-[140px] w-full resize-y rounded-[10px] border px-3.5 py-3 text-[13px] leading-5 outline-none"
          />
          <div className="flex gap-1.5">
            <span className="bg-surface-muted text-fg-subtle rounded px-1.5 py-0.5 text-[10px] font-medium">
              Markdown 지원
            </span>
            <span className="bg-surface-muted text-fg-subtle rounded px-1.5 py-0.5 text-[10px] font-medium">
              최소 80자 권장
            </span>
          </div>
        </section>
      )}

      {/* 하단 액션바 — brand-deep. CTA raw #29b5b0 은 brand 토큰으로 conform. */}
      <section className="bg-brand-deep text-on-color flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-[18px] shadow-[0_8px_24px_rgba(18,23,38,0.18)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold">{actionTitle}</span>
          <span className="text-on-color/70 text-[11px]">
            {RECOMMENDATION_ACTION_CAPTION}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="border-on-color/70 text-on-color hover:bg-on-color/10 flex items-center gap-1 rounded-[10px] border px-4 py-2.5 text-[13px] font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            평가로 돌아가기
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={closed || !canSubmit || submitMutation.isPending}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] px-5 py-2.5 text-[13px] font-bold',
              !closed && canSubmit
                ? 'bg-brand text-on-color hover:bg-brand/90'
                : 'bg-fg-subtle text-on-color cursor-not-allowed',
            )}
          >
            {closed
              ? '제출 마감 — 계약 종료'
              : submitted
                ? '수정 재제출'
                : '추천 제출'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <ConfirmSubmitModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmSubmit}
        eyebrow={RECOMMENDATION_CONFIRM_EYEBROW}
        title={RECOMMENDATION_CONFIRM_TITLE}
        body={RECOMMENDATION_CONFIRM_BODY}
        pending={submitMutation.isPending}
      />
    </div>
  )
}

function ModeCard({
  selected,
  disabled = false,
  onSelect,
  icon,
  title,
  desc,
}: {
  selected: boolean
  /** 계약 종료 마감 — 선택 잠금(자세히 보기 전용). */
  disabled?: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex flex-1 basis-64 items-center gap-3.5 rounded-[14px] p-[18px] text-left',
        selected
          ? 'bg-brand/10 border-brand border-2'
          : 'border-border bg-surface hover:bg-surface-muted border',
      )}
    >
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          selected
            ? 'bg-brand text-on-color'
            : 'bg-surface-muted text-fg-muted',
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="text-fg text-base font-bold">{title}</span>
          {selected && (
            <span className="bg-brand text-on-color rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold">
              선택됨
            </span>
          )}
        </span>
        <span className="text-fg-muted text-[11px]">{desc}</span>
      </span>
      <RadioDot selected={selected} />
    </button>
  )
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
        selected ? 'border-brand border-[7px]' : 'border-border border-[1.5px]',
      )}
      aria-hidden
    />
  )
}

function CandidateCard({
  candidate,
  index,
  selected,
  disabled,
  onSelect,
}: {
  candidate: MentorRecommendationCandidate
  index: number
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const roleLabel =
    candidate.tagLabel ?? (candidate.role === 'pm' ? 'PM' : '팀원')
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${candidate.name} 추천`}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex flex-col gap-2 rounded-[14px] p-4 text-left',
        selected
          ? 'bg-brand/10 border-brand border-2 shadow-[0_6px_18px_rgba(26,140,133,0.18)]'
          : 'border-border bg-surface hover:bg-surface-muted border shadow-[0_2px_8px_rgba(18,23,38,0.04)]',
      )}
    >
      <span className="flex w-full items-start justify-between">
        <span
          className={cn(
            'text-on-color flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold',
            memberAvatarBg(index),
          )}
          aria-hidden
        >
          {candidate.name.charAt(0)}
        </span>
        <RadioDot selected={selected} />
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-fg text-[15px] font-bold">{candidate.name}</span>
        <span
          className={cn(
            'rounded-[5px] px-[7px] py-0.5 text-[10px] font-bold',
            candidate.role === 'pm'
              ? 'bg-accent-strong text-on-color'
              : 'bg-surface-muted text-fg-subtle',
          )}
        >
          {roleLabel}
        </span>
      </span>
      <span className="flex items-baseline gap-1">
        <span className="text-fg-subtle text-[11px]">평가 평균</span>
        <span className="text-fg text-lg font-bold">
          {candidate.average ?? '-'}
        </span>
        <span className="text-fg-subtle text-[11px]">
          {candidate.average == null ? '평가 미작성' : '/ 5.0'}
        </span>
      </span>
      <span className="flex w-full flex-col gap-1">
        {EVALUATION_AXES.map((axis, axisIndex) => {
          const score = candidate.scores[axisIndex] ?? 0
          return (
            <span
              key={axis.label}
              className="flex items-center justify-between gap-1.5"
            >
              <span className="text-fg-subtle text-[10px]">{axis.label}</span>
              <span className="flex items-center gap-1">
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <span
                      key={step}
                      className={cn(
                        'h-2 w-2 rounded-[2px]',
                        step <= score ? axis.fill : 'bg-surface-muted',
                      )}
                      aria-hidden
                    />
                  ))}
                </span>
                <span className="text-fg w-3 text-right text-[11px] font-bold">
                  {score}
                </span>
              </span>
            </span>
          )
        })}
      </span>
      {selected && (
        <span className="bg-brand text-on-color flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold">
          <Star className="h-3 w-3 fill-current" />
          추천 대상
        </span>
      )}
    </button>
  )
}
