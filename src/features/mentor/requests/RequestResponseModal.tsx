import { useCallback, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  Calendar,
  Check,
  FileText,
  Home,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import {
  useMentoringRequestAction,
  useMentoringRequestDetail,
  useUpdateConfirmedDetails,
} from '../api/requests'
import type { MentoringRequestSlot } from '../types'
import { MENTORING_PLACE_TYPE_LABEL } from '../types'
import { RequestStatusChip, RoleBadge, SlotLabelChip } from './RequestChips'
import type { RequestRespondedState } from './RequestRespondedPage'
import {
  composeScheduleLabel,
  parseScheduleLabel,
  proposalSchema,
  type ProposalInput,
} from './proposalSchema'

type ResponseMode = 'confirm' | 'counter' | 'reject'

// 응답 모드 라디오 카드 3종 — Figma 원문(확정/조정 제안/거절 + 보조 설명).
// 틴트 매핑: #d6f2e8→success-bg · #f0edfa→accent-bg · 거절 아이콘 박스→danger-bg.
const MODE_META: Record<
  ResponseMode,
  { label: string; sub: string; icon: LucideIcon; iconBox: string }
> = {
  confirm: {
    label: '확정',
    sub: '희망 일정 그대로',
    icon: Check,
    iconBox: 'bg-success-bg text-success',
  },
  counter: {
    label: '조정 제안',
    sub: '일정·장소·시간 수정',
    icon: Calendar,
    iconBox: 'bg-accent-bg text-accent-strong',
  },
  reject: {
    label: '거절',
    sub: '요청 거절 + 사유',
    icon: X,
    iconBox: 'bg-danger-bg text-danger',
  },
}

const FIELD_LABEL = 'text-fg-subtle text-[11px] font-medium tracking-[0.66px]'
const INPUT_CLASS =
  'border-accent-strong/60 bg-surface text-fg placeholder:text-fg-subtle h-[38px] w-full rounded-lg border px-3 text-[13px] font-medium outline-none focus:border-accent-strong focus-visible:shadow-none'
const SAVE_BTN =
  'bg-accent-strong text-on-color hover:bg-accent-strong/90 flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-50'

/** 희망/확정 일정 상세 박스 — 모달 변형(일시 15px Bold + 장소·예상 행 + 요청 메모 중첩 박스). */
function DetailScheduleBox({
  label,
  slot,
}: {
  label: string
  slot: MentoringRequestSlot
}) {
  return (
    <div className="bg-surface-muted flex flex-col gap-2.5 rounded-xl p-4">
      <SlotLabelChip label={label} />
      <span className="text-fg flex items-center gap-2 text-[15px] font-bold">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        {slot.dateTimeLabel}
      </span>
      <span className="text-fg-muted flex flex-wrap items-center gap-2 text-[13px] font-medium">
        <span className="flex items-center gap-1.5">
          <Home className="h-3.5 w-3.5 shrink-0" />
          {MENTORING_PLACE_TYPE_LABEL[slot.placeType]} · {slot.placeDetail}
        </span>
        <span className="bg-divider h-3 w-px" aria-hidden />
        <span className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 shrink-0" />
          예상 {slot.expectedMinutes}분
        </span>
      </span>
      {slot.memo && (
        <div className="bg-surface border-divider flex flex-col gap-1 rounded-lg border px-3.5 py-3">
          <span className="text-fg-subtle flex items-center gap-1 text-[10px] font-bold">
            <FileText className="h-3 w-3" />
            요청 메모
          </span>
          <p className="text-fg-muted text-[13px] leading-5">{slot.memo}</p>
        </div>
      )}
    </div>
  )
}

/**
 * 내 조정 제안 / 확정 정보 변경 폼 — RHF + Zod(일정·예상 시간·장소 필수, 메모 선택).
 * 푸터 '선택한 응답 저장'이 form 속성으로 제출한다(id=proposal-form).
 */
function ProposalForm({
  chipLabel,
  defaults,
  onValid,
}: {
  chipLabel: string
  defaults: ProposalInput
  onValid: (values: ProposalInput) => void
}) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProposalInput>({
    resolver: zodResolver(proposalSchema),
    defaultValues: defaults,
  })
  const placeType = watch('placeType')
  return (
    <form
      id="proposal-form"
      noValidate
      onSubmit={handleSubmit(onValid)}
      className="bg-accent-bg flex flex-col gap-2.5 rounded-xl p-3.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-accent-strong text-on-color rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
          {chipLabel}
        </span>
        <span className="text-accent-strong min-w-0 text-[11px] font-medium">
          선택한 응답 모드에 따라 확정·조정 제안·거절 알림이 수강생에게
          전송됩니다
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>새 일정</span>
        {/* 날짜는 전용 줄(달력), 시작·종료 시각은 한 줄에 나란히 — 공용 DateTimePicker */}
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DateTimePicker
              mode="date"
              value={field.value}
              onChange={field.onChange}
              placeholder="날짜 선택"
              ariaLabel="새 일정 날짜"
              error={errors.date?.message}
            />
          )}
        />
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="startTime"
            render={({ field }) => (
              <DateTimePicker
                mode="time"
                value={field.value}
                onChange={field.onChange}
                placeholder="시작 시각"
                ariaLabel="시작 시각"
                error={errors.startTime?.message}
              />
            )}
          />
          <span className="text-fg-subtle text-[13px]">~</span>
          <Controller
            control={control}
            name="endTime"
            render={({ field }) => (
              <DateTimePicker
                mode="time"
                value={field.value}
                onChange={field.onChange}
                placeholder="종료 시각"
                ariaLabel="종료 시각"
                error={errors.endTime?.message}
              />
            )}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className={FIELD_LABEL}>장소 유형</span>
          <div
            role="radiogroup"
            aria-label="장소 유형"
            className="flex h-[38px] items-center gap-1.5"
          >
            {(['offline', 'online', 'etc'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={placeType === v}
                onClick={() =>
                  setValue('placeType', v, { shouldValidate: true })
                }
                className={cn(
                  'rounded-[7px] px-2.5 py-1.5 text-xs whitespace-nowrap',
                  placeType === v
                    ? 'bg-accent-strong text-on-color font-bold'
                    : 'border-accent-strong/40 text-fg-muted bg-surface border font-medium',
                )}
              >
                {MENTORING_PLACE_TYPE_LABEL[v]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="proposal-minutes" className={FIELD_LABEL}>
            예상 시간 (분)
          </label>
          <input
            id="proposal-minutes"
            inputMode="numeric"
            {...register('expectedMinutes')}
            placeholder="90"
            className={INPUT_CLASS}
          />
          {errors.expectedMinutes && (
            <p className="text-danger text-[11px]">
              {errors.expectedMinutes.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="proposal-place" className={FIELD_LABEL}>
          상세 장소
        </label>
        <input
          id="proposal-place"
          {...register('placeDetail')}
          placeholder="Zoom · 미팅 ID는 확정 후 공유"
          className={INPUT_CLASS}
        />
        {errors.placeDetail && (
          <p className="text-danger text-[11px]">
            {errors.placeDetail.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="proposal-note" className={FIELD_LABEL}>
          멘토 메모 (선택)
        </label>
        <textarea
          id="proposal-note"
          {...register('mentorResponseNote')}
          className={cn(
            INPUT_CLASS,
            'h-[72px] resize-none py-2.5 leading-[18px]',
          )}
        />
      </div>
    </form>
  )
}

// 예약 요청 상세/응답 모달 (/mentor/mentoring-requests/:requestId) — Figma 2553:3942.
// 목록 위 URL 라우팅 모달(중첩 라우트) — 헤더 타이틀은 부모('멘토링 예약 요청') 유지.
// 카드 버튼의 ?mode= 로 응답 모드 프리셀렉트. 저장 성공 = 공통 토스트 + 목록 잔류(결정 ③).
export default function RequestResponseModal() {
  const { requestId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError } = useMentoringRequestDetail(requestId)
  const actionMutation = useMentoringRequestAction()
  const detailsMutation = useUpdateConfirmedDetails()

  const paramMode = searchParams.get('mode')
  const [mode, setMode] = useState<ResponseMode>(
    paramMode === 'reject'
      ? 'reject'
      : paramMode === 'counter'
        ? 'counter'
        : 'confirm',
  )
  // 거절 응답 메모 — 필수/선택 정책 미확정(P0-MTR-RES-005) TODO: 선택 입력으로 구현.
  const [rejectNote, setRejectNote] = useState('')

  // 공통 Modal 이 onClose 를 effect deps 로 쓰므로 참조 고정 — 입력 중 재렌더 시 포커스 이탈 방지.
  const close = useCallback(
    () => navigate('/mentor/mentoring-requests'),
    [navigate],
  )
  const saving = actionMutation.isPending || detailsMutation.isPending
  const goResponded = (state: RequestRespondedState) =>
    navigate('/mentor/mentoring-requests/submitted', { state })
  const onFailed = () =>
    toast.danger('응답 저장에 실패했어요. 잠시 후 다시 시도해 주세요.')

  if (!data) {
    return (
      <Modal open onClose={close} size="lg" title="예약 요청 응답">
        <DataBoundary
          isPending={isPending}
          isError={isError || !data}
          loadingText="예약 요청을 불러오는 중…"
          errorTitle="예약 요청을 찾을 수 없어요"
          errorDescription="목록에서 요청을 다시 선택해 주세요."
        >
          {null}
        </DataBoundary>
      </Modal>
    )
  }

  const status = data.status
  const respondable = status === 'requested' // 확정/조정 제안/거절 3모드
  const proposalEditable = status === 'counter_proposed' // 제안 수정
  const confirmedEditable = status === 'confirmed' // 확정 상세 변경(PATCH)
  const actionable = respondable || proposalEditable || confirmedEditable
  const formMode =
    (respondable && mode === 'counter') || proposalEditable || confirmedEditable

  // 폼 기본값 — 제안 수정은 기존 제안, 확정 변경은 확정 일정, 신규 조정 제안은 희망 일정 프리필.
  const baseSlot = confirmedEditable
    ? (data.confirmed ?? data.desired)
    : proposalEditable
      ? (data.proposal ?? data.desired)
      : data.desired
  const baseSchedule = parseScheduleLabel(baseSlot.dateTimeLabel)
  const formDefaults: ProposalInput = {
    date: baseSchedule.date,
    startTime: baseSchedule.startTime,
    endTime: baseSchedule.endTime,
    placeType: baseSlot.placeType,
    expectedMinutes: baseSlot.expectedMinutes,
    placeDetail: baseSlot.placeDetail,
    mentorResponseNote:
      proposalEditable || confirmedEditable
        ? (data.mentorResponseNote ?? '')
        : '',
  }

  const submitProposal = (values: ProposalInput) => {
    const payload = {
      dateTimeLabel: composeScheduleLabel(values),
      placeType: values.placeType,
      placeDetail: values.placeDetail,
      expectedMinutes: values.expectedMinutes,
      mentorResponseNote: values.mentorResponseNote || undefined,
    }
    const onSuccess = () =>
      goResponded({
        outcome: confirmedEditable ? 'updated' : 'counter',
        submittedAtLabel: '방금',
        teamLabel: `${data.cohortLabel} · ${data.teamName}`,
        waitingForStudent: !confirmedEditable,
        rows: [
          {
            label: confirmedEditable ? '확정 일정' : '제안 일정',
            value: payload.dateTimeLabel,
          },
          {
            label: '장소',
            value: `${MENTORING_PLACE_TYPE_LABEL[payload.placeType]} · ${payload.placeDetail}`,
          },
          { label: '예상 시간', value: `${payload.expectedMinutes}분` },
          ...(payload.mentorResponseNote
            ? [{ label: '메모', value: payload.mentorResponseNote }]
            : []),
        ],
      })
    if (confirmedEditable) {
      detailsMutation.mutate(
        { requestId, payload },
        { onSuccess, onError: onFailed },
      )
    } else {
      actionMutation.mutate(
        { requestId, action: 'counter-propose', payload },
        { onSuccess, onError: onFailed },
      )
    }
  }

  const directSave = () => {
    if (!respondable) return
    const teamLabel = `${data.cohortLabel} · ${data.teamName}`
    if (mode === 'confirm') {
      // 확정 = 희망 일정 그대로(서버가 요청 슬롯으로 확정 — ReservationActionRequest 공용 필드)
      actionMutation.mutate(
        { requestId, action: 'confirm' },
        {
          onSuccess: () =>
            goResponded({
              outcome: 'confirmed',
              submittedAtLabel: '방금',
              teamLabel,
              waitingForStudent: false,
              rows: [
                { label: '확정 일정', value: data.desired.dateTimeLabel },
                {
                  label: '장소',
                  value: `${MENTORING_PLACE_TYPE_LABEL[data.desired.placeType]} · ${data.desired.placeDetail}`,
                },
                {
                  label: '예상 시간',
                  value: `${data.desired.expectedMinutes}분`,
                },
              ],
            }),
          onError: onFailed,
        },
      )
    } else if (mode === 'reject') {
      actionMutation.mutate(
        {
          requestId,
          action: 'reject',
          payload: { mentorResponseNote: rejectNote.trim() || undefined },
        },
        {
          onSuccess: () =>
            goResponded({
              outcome: 'rejected',
              submittedAtLabel: '방금',
              teamLabel,
              waitingForStudent: false,
              rows: [
                { label: '요청자', value: data.requester.name },
                {
                  label: '거절 사유',
                  value: rejectNote.trim() || '사유 미기재',
                },
              ],
            }),
          onError: onFailed,
        },
      )
    }
  }

  const detailSlot =
    (status === 'confirmed' || status === 'completed') && data.confirmed
      ? data.confirmed
      : data.desired
  const detailSlotLabel =
    (status === 'confirmed' || status === 'completed') && data.confirmed
      ? '확정 일정'
      : '희망 일정'

  return (
    <Modal
      open
      onClose={close}
      size="lg"
      title={
        <span className="flex flex-col items-start gap-1.5">
          <span className="flex items-center gap-1.5">
            <span className="bg-surface-muted text-fg-subtle rounded px-1.5 py-0.5 text-[10px] font-bold tracking-[0.8px] whitespace-nowrap">
              예약 요청 응답
            </span>
            <RequestStatusChip status={status} />
          </span>
          <span>
            {data.cohortLabel} · {data.teamName}
          </span>
        </span>
      }
      footer={
        <>
          {actionable && (
            <p className="text-fg-subtle mr-auto self-center text-[11px]">
              확정은 예약 확정, 조정 제안은 수강생 응답 대기, 거절은 요청 종료로
              저장됩니다
            </p>
          )}
          <button
            type="button"
            onClick={close}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
          >
            닫기
          </button>
          {actionable &&
            (formMode ? (
              <button
                type="submit"
                form="proposal-form"
                disabled={saving}
                className={SAVE_BTN}
              >
                선택한 응답 저장
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={directSave}
                disabled={saving}
                className={SAVE_BTN}
              >
                선택한 응답 저장
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ))}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* 요청자 */}
        <div className="flex items-center gap-3">
          <Avatar name={data.requester.name} size={44} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-fg text-sm font-semibold">
                {data.requester.name}
              </span>
              <RoleBadge role={data.requester.role} />
              <span className="text-fg-subtle text-[11px]">요청자</span>
            </div>
            <span className="text-fg-muted text-[11px]">
              요청일 {data.requestedAtLabel}
              {data.dDayLabel ? ` · 처리 마감 ${data.dDayLabel}` : ''}
            </span>
          </div>
        </div>

        <DetailScheduleBox label={detailSlotLabel} slot={detailSlot} />

        {/* 응답 모드 — 요청 대기에서만 3모드. 조정 제안 상태의 확정/거절은 수강생 몫(상태 전이표). */}
        {respondable && (
          <div className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>응답 모드</span>
            <div
              role="radiogroup"
              aria-label="응답 모드"
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              {(Object.keys(MODE_META) as ResponseMode[]).map((m) => {
                const meta = MODE_META[m]
                const Icon = meta.icon
                const selected = mode === m
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMode(m)}
                    className={cn(
                      'flex flex-col gap-2 rounded-[10px] p-3 text-left',
                      selected
                        ? 'bg-accent-bg border-accent-strong border-[1.5px]'
                        : 'border-border bg-surface hover:bg-surface-muted border',
                    )}
                  >
                    <span className="flex items-start justify-between">
                      <span
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-[7px]',
                          meta.iconBox,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          'bg-surface h-[18px] w-[18px] rounded-full',
                          selected
                            ? 'border-accent-strong border-[5px]'
                            : 'border-border border-[1.5px]',
                        )}
                      />
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-fg text-[13px] font-bold">
                        {meta.label}
                      </span>
                      <span className="text-fg-subtle text-[11px]">
                        {meta.sub}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {formMode && (
          <ProposalForm
            key={`${status}-${mode}`}
            chipLabel={confirmedEditable ? '확정 정보 변경' : '내 조정 제안'}
            defaults={formDefaults}
            onValid={submitProposal}
          />
        )}

        {respondable && mode === 'reject' && (
          <div className="bg-surface-muted/50 flex flex-col gap-1.5 rounded-xl p-3.5">
            <label htmlFor="reject-note" className={FIELD_LABEL}>
              거절 사유 메모 (선택)
            </label>
            <textarea
              id="reject-note"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="거절 사유를 수강생에게 전달할 수 있어요"
              className="border-border text-fg placeholder:text-fg-subtle h-[72px] w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] leading-[18px] outline-none"
            />
          </div>
        )}

        {/* 종결 상태(완료·거절·취소) — 응답 메모만 읽기 전용 표시 */}
        {!actionable && data.mentorResponseNote && (
          <div className="bg-surface-muted/50 flex flex-col gap-1 rounded-xl p-3.5">
            <span className="text-fg-subtle flex items-center gap-1 text-[10px] font-bold">
              <FileText className="h-3 w-3" />
              응답 메모
            </span>
            <p className="text-fg-muted text-[13px] leading-5">
              {data.mentorResponseNote}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
