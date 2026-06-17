import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  FileText,
  Flag,
  Lock,
  Pencil,
  Plus,
  Send,
  Timer,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import {
  useLogFieldSnapshot,
  useMentoringLogDetail,
  useMentoringLogTargets,
  useSaveLogDraft,
  useSubmitMentoringLog,
} from '../api/logs'
import { MENTOR_FLOW_CAPTION } from '../constants'
import type {
  MentoringLogDetailData,
  MentoringLogDraftPayload,
  MentoringLogFieldSnapshot,
  MentoringLogTarget,
} from '../types'
import { MENTORING_PLACE_TYPE_LABEL } from '../types'
import { CharCounter, RequiredChip } from './LogChips'
import { buildLogFormSchema, type LogFormInput } from './logFormSchema'
import {
  LOG_DRAFT_SAVED_TOAST,
  LOG_SUBMIT_POLICY_CAPTION,
  durationLabel,
  minutesBetween,
} from './logMeta'

const round1 = (n: number) => Math.round(n * 10) / 10

const FIELD_LABEL = 'text-fg-subtle text-[11px] font-medium tracking-[0.66px]'
const INPUT_BOX =
  'border-border bg-surface text-fg placeholder:text-fg-subtle h-[46px] rounded-[10px] border px-3.5 text-sm font-medium outline-none focus:border-brand'
const HELPER = 'text-fg-subtle text-[11px]'

const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const
const dateWithDow = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? `${date}(${DOW[new Date(`${date}T00:00`).getDay()]})`
    : ''

type ComposeMode = 'new' | 'draft' | 'resubmit'

// 멘토링 일지 작성/수정 (/mentor/mentoring-logs/new) — Figma 2553:4166.
// 모드: 신규(?teamId= 프리셋) / 이어 작성(?logId= 초안) / 수정·재제출(?logId= 수정 요청).
// 제출된 유효 일지는 진입 차단 — 제출 즉시 자동 유효 + 임의 수정·삭제 불가(05-31 확정).
export default function LogComposePage() {
  usePageHeader('멘토링 일지 작성/수정', MENTOR_FLOW_CAPTION)
  const [searchParams] = useSearchParams()
  const logId = searchParams.get('logId') ?? ''
  const presetTeamId = searchParams.get('teamId') ?? ''
  const targetsQuery = useMentoringLogTargets()
  const detailQuery = useMentoringLogDetail(logId)

  if (targetsQuery.isPending || (!!logId && detailQuery.isPending)) {
    return <div className="text-fg-muted p-8">작성 정보를 불러오는 중…</div>
  }
  if (
    targetsQuery.isError ||
    !targetsQuery.data ||
    (!!logId && (detailQuery.isError || !detailQuery.data))
  ) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="작성 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={
            <Button onClick={() => targetsQuery.refetch()}>다시 시도</Button>
          }
        />
      </div>
    )
  }
  const detail = logId ? (detailQuery.data ?? null) : null
  if (detail && detail.status === 'valid') {
    return (
      <div className="p-8">
        <Empty
          icon={<Lock />}
          title="제출된 일지는 수정할 수 없어요"
          description="제출 즉시 자동 유효로 확정됩니다. 운영자 수정 요청이 있을 때만 전체 수정 후 재제출할 수 있어요."
          action={
            <Link
              to="/mentor/mentoring-logs"
              className="border-border text-fg hover:bg-surface-muted flex h-14 items-center rounded-[11px] border bg-white px-5 text-[15px] font-bold"
            >
              일지 목록으로
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <LogComposeForm
      targets={targetsQuery.data.targets}
      detail={detail}
      presetTeamId={presetTeamId}
    />
  )
}

function LogComposeForm({
  targets,
  detail,
  presetTeamId,
}: {
  targets: MentoringLogTarget[]
  detail: MentoringLogDetailData | null
  presetTeamId: string
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const draftMutation = useSaveLogDraft()
  const submitMutation = useSubmitMentoringLog()

  const mode: ComposeMode = detail
    ? detail.status === 'draft'
      ? 'draft'
      : 'resubmit'
    : 'new'

  const initialTeamId =
    detail?.teamId ??
    (targets.some((t) => t.teamId === presetTeamId)
      ? presetTeamId
      : (targets[0]?.teamId ?? ''))
  const initialTarget = targets.find((t) => t.teamId === initialTeamId)

  // 템플릿 항목은 팀 스냅샷으로 동적 — getter 주입 스키마(검증 시점의 최신 항목 사용)
  const fieldsRef = useRef<MentoringLogFieldSnapshot[]>([])
  const schema = useMemo(() => buildLogFormSchema(() => fieldsRef.current), [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<LogFormInput>({
    resolver: zodResolver(schema),
    defaultValues: detail
      ? {
          teamId: detail.teamId,
          sessionDate: detail.sessionDate,
          startTime: detail.startTime,
          endTime: detail.endTime,
          placeType: detail.placeType,
          placeDetail: detail.placeDetail,
          attendedIds: detail.attendees
            .filter((a) => a.attended)
            .map((a) => a.studentId),
          answers: Object.fromEntries(
            detail.answers.map((a) => [a.field.fieldSnapshotId, a.value]),
          ),
        }
      : {
          teamId: initialTeamId,
          sessionDate: '',
          startTime: '',
          endTime: '',
          placeType: 'offline',
          placeDetail: '',
          attendedIds: initialTarget?.members.map((m) => m.studentId) ?? [],
          answers: {},
        },
  })

  const teamId = watch('teamId')
  const target = targets.find((t) => t.teamId === teamId)

  // 운영 적용 템플릿 항목 스냅샷 — 멘토는 렌더링만(항목 편집 불가)
  const fieldsQuery = useLogFieldSnapshot(teamId)
  const fields = useMemo(() => fieldsQuery.data ?? [], [fieldsQuery.data])
  fieldsRef.current = fields
  const textFields = fields.filter((f) => !f.inputKind)
  const filesField = fields.find((f) => f.inputKind === 'files')
  const photosField = fields.find((f) => f.inputKind === 'photos')

  const sessionDate = watch('sessionDate')
  const startTime = watch('startTime')
  const endTime = watch('endTime')
  const placeType = watch('placeType')
  const attendedIds = watch('attendedIds')
  const answers = watch('answers')

  // 시간 차감 자동 산정 프리뷰 — 인정 = min(실제, max(잔여, 0)), 초과는 기록만(SSOT 수식)
  const actualMinutes = minutesBetween(startTime, endTime)
  const remainingHours = target?.remainingHours ?? 0
  const recognizedPreview =
    actualMinutes > 0 ? Math.min(round1(actualMinutes / 60), remainingHours) : 0
  const excessPreview =
    actualMinutes > 0
      ? round1(Math.max(actualMinutes / 60 - recognizedPreview, 0))
      : 0
  const afterRemaining = round1(Math.max(remainingHours - recognizedPreview, 0))

  const requiredFields = fields.filter((f) => f.required)
  const requiredDone = requiredFields.filter((f) =>
    (answers?.[f.fieldSnapshotId] ?? '').trim(),
  ).length

  const round = detail?.round ?? target?.nextRound ?? 1

  // 초안 보관 logId — 신규 작성도 첫 임시 저장 후 같은 초안을 갱신한다
  const [draftId, setDraftId] = useState(
    detail && detail.status === 'draft' ? detail.logId : '',
  )
  const [savedLabel, setSavedLabel] = useState<string | null>(
    detail && detail.status === 'draft' ? '초안 보관 중' : null,
  )
  const [showTemplate, setShowTemplate] = useState(false)
  // 첨부·사진 — 업로드 계약 미확정(DB 스키마 갭 openQuestion)이라 파일명 표시 전용(payload 미포함)
  const [artifactNames, setArtifactNames] = useState<string[]>([])
  const [photoNames, setPhotoNames] = useState<string[]>([])

  const saving = draftMutation.isPending || submitMutation.isPending

  const toPayload = (v: LogFormInput): MentoringLogDraftPayload => ({
    teamId: v.teamId,
    sessionDate: v.sessionDate || undefined,
    startTime: v.startTime || undefined,
    endTime: v.endTime || undefined,
    placeType: v.placeType,
    placeDetail: v.placeDetail,
    attendedIds: v.attendedIds,
    answers: fieldsRef.current
      .filter((f) => !f.inputKind)
      .map((f) => ({
        fieldSnapshotId: f.fieldSnapshotId,
        value: v.answers[f.fieldSnapshotId] ?? '',
      })),
  })

  // 임시 저장 — 검증 없이 부분 입력 그대로 보관(DRAFT 자유 수정·인정 시간 미반영)
  const onSaveDraft = () => {
    draftMutation.mutate(
      { logId: draftId || undefined, payload: toPayload(getValues()) },
      {
        onSuccess: (log) => {
          setDraftId(log.logId)
          setSavedLabel('방금')
          toast.success(LOG_DRAFT_SAVED_TOAST)
        },
        onError: () =>
          toast.danger('임시 저장에 실패했어요. 잠시 후 다시 시도해 주세요.'),
      },
    )
  }

  // 제출·재제출 — 성공 시 목록 복귀 + 제출 완료 토스트(?toast=submitted, 2582:6348)
  const onSubmit = handleSubmit(
    async (values) => {
      const payload = toPayload(values)
      try {
        if (mode === 'resubmit') {
          await submitMutation.mutateAsync({
            logId: detail!.logId,
            mode: 'resubmit',
            payload,
          })
        } else {
          const id =
            draftId || (await draftMutation.mutateAsync({ payload })).logId
          await submitMutation.mutateAsync({
            logId: id,
            mode: 'submit',
            payload,
          })
        }
        navigate('/mentor/mentoring-logs?toast=submitted')
      } catch {
        toast.danger(
          mode === 'resubmit'
            ? '일지 재제출에 실패했어요. 잠시 후 다시 시도해 주세요.'
            : '일지 제출에 실패했어요. 잠시 후 다시 시도해 주세요.',
        )
      }
    },
    () => toast.danger('필수 항목을 확인해 주세요.'),
  )

  const onTeamChange = (nextTeamId: string) => {
    setValue('teamId', nextTeamId, { shouldValidate: true })
    // 팀 변경 → 참석 멘티를 새 팀원 전원으로 리셋(회차·시간 산정도 자동 갱신)
    const next = targets.find((t) => t.teamId === nextTeamId)
    setValue('attendedIds', next?.members.map((m) => m.studentId) ?? [])
  }

  const toggleAttendee = (studentId: string) => {
    const current = getValues('attendedIds')
    setValue(
      'attendedIds',
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
      { shouldValidate: true },
    )
  }

  const heroEyebrow =
    mode === 'new'
      ? 'MENTORING LOG · 새 일지'
      : mode === 'draft'
        ? 'MENTORING LOG · 이어 작성'
        : 'MENTORING LOG · 일지 수정 · 재제출'

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-5 p-8"
      aria-label="멘토링 일지 작성"
    >
      {/* 브레드크럼 + 저장 상태 칩 */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/mentor/mentoring-logs"
          className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-2.5 py-[5px] text-xs font-medium"
        >
          <ArrowLeft className="h-3 w-3" />
          멘토링 일지
        </Link>
        <span className="text-fg-subtle text-[13px]">›</span>
        <span className="text-fg text-xs font-medium">
          {mode === 'new'
            ? '새 일지 작성'
            : mode === 'draft'
              ? '이어 작성'
              : '일지 수정'}
        </span>
        <span className="bg-surface-muted text-fg-muted ml-auto flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium">
          <Pencil className="h-3 w-3" />
          {savedLabel
            ? `임시 저장 · ${savedLabel}`
            : '저장 전 — 임시 저장 가능'}
        </span>
      </div>

      {/* Hero — brand 배너 + 필수 항목 진행 필 */}
      <section className="bg-brand text-on-color flex flex-wrap items-center justify-between gap-4 rounded-2xl px-7 py-5 shadow-[0_8px_22px_rgba(26,140,133,0.18)]">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-[1.98px]">
            {heroEyebrow}
          </span>
          <h2 className="text-[22px] leading-7 font-bold">
            {target ? `${target.teamName} · ${round}회차` : '대상 팀 선택'}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1">
              <Send className="h-3 w-3" />
              {target?.cohortLabel ?? '-'}
            </span>
            <span
              className="bg-on-color/60 h-[3px] w-[3px] rounded-full"
              aria-hidden
            />
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateWithDow(sessionDate) || '진행 일자 입력 전'}
            </span>
            <span
              className="bg-on-color/60 h-[3px] w-[3px] rounded-full"
              aria-hidden
            />
            <span className="flex items-center gap-1">
              <Flag className="h-3 w-3" />
              {MENTORING_PLACE_TYPE_LABEL[placeType]}
            </span>
          </div>
        </div>
        <div className="bg-surface text-fg flex flex-col items-center gap-0.5 rounded-[10px] px-4 py-2.5">
          <span className="text-fg-subtle text-[10px] font-medium tracking-[0.8px]">
            필수 항목
          </span>
          <span className="text-sm font-bold">
            {requiredDone} / {requiredFields.length || 3}
          </span>
        </div>
      </section>

      {/* 기본 정보 */}
      <section className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-6 shadow-[0_2px_8px_rgba(18,23,38,0.04)]">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-fg text-[15px] font-bold">기본 정보</h3>
          <p className="text-fg-muted text-[11px]">
            진행 일시·장소·실제 시간을 입력하세요 · 실제 시간 기준으로 인정
            시간이 자동 산정됩니다
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          {/* 대상 팀 — 수정 모드에선 고정(작성 시 결정) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="log-team" className={FIELD_LABEL}>
              대상 팀 *
            </label>
            <select
              id="log-team"
              value={teamId}
              disabled={mode !== 'new'}
              onChange={(e) => onTeamChange(e.target.value)}
              className={cn(INPUT_BOX, 'disabled:bg-surface-muted w-full')}
            >
              {targets.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.cohortLabel} · {t.teamName}
                </option>
              ))}
            </select>
            {target && (
              <span className={HELPER}>
                {target.nextRound}회차 멘토링 · 누적 {target.accumulatedHours}h
                / 배정 N시간 {target.allocatedHours}h · 잔여{' '}
                {target.remainingHours}h
              </span>
            )}
            {errors.teamId && (
              <p className="text-danger text-[11px]">{errors.teamId.message}</p>
            )}
          </div>
          {/* 회차 — 자동 산정 잠금 */}
          <div className="flex flex-col gap-1">
            <span className={FIELD_LABEL}>회차</span>
            <span className="bg-surface-muted flex h-[46px] items-center gap-1.5 rounded-[10px] px-3.5">
              <span className="text-fg text-base font-bold">{round}</span>
              <span className="text-fg-muted text-[13px] font-medium">
                회차
              </span>
              <AutoLockChip />
            </span>
            <span className={HELPER}>동일 팀 일지 누적 자동 산정</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          {/* 진행 일시 — 날짜 + 시작 → 종료(분 단위) */}
          <div className="flex flex-col gap-1">
            <span className={FIELD_LABEL}>진행 일시 *</span>
            <div className="flex flex-wrap items-center gap-2">
              {/* 공통 DateTimePicker — 날짜(달력) + 시작·종료 시각(분 단위 정밀: minuteStep=1) */}
              <div className="w-[136px]">
                <DateTimePicker
                  mode="date"
                  value={sessionDate ?? ''}
                  onChange={(v) =>
                    setValue('sessionDate', v, { shouldValidate: true })
                  }
                  ariaLabel="진행 일자"
                  placeholder="날짜 선택"
                />
              </div>
              <div className="w-[150px]">
                <DateTimePicker
                  mode="time"
                  minuteStep={1}
                  value={startTime ?? ''}
                  onChange={(v) =>
                    setValue('startTime', v, { shouldValidate: true })
                  }
                  ariaLabel="시작 시각"
                  placeholder="시작"
                />
              </div>
              <ArrowRight className="text-fg-subtle h-3.5 w-3.5 shrink-0" />
              <div className="w-[150px]">
                <DateTimePicker
                  mode="time"
                  minuteStep={1}
                  value={endTime ?? ''}
                  onChange={(v) =>
                    setValue('endTime', v, { shouldValidate: true })
                  }
                  ariaLabel="종료 시각"
                  placeholder="종료"
                />
              </div>
            </div>
            <span className={HELPER}>
              시작·종료 시각을 분 단위까지 입력 · 합계 자동 산정
            </span>
            {(errors.sessionDate || errors.startTime || errors.endTime) && (
              <p className="text-danger text-[11px]">
                {errors.sessionDate?.message ??
                  errors.startTime?.message ??
                  errors.endTime?.message}
              </p>
            )}
          </div>
          {/* 실제 진행 시간 — 자동 계산 잠금 */}
          <div className="flex flex-col gap-1">
            <span className={FIELD_LABEL}>실제 진행 시간 *</span>
            <span className="bg-surface-muted flex h-[46px] items-center gap-1.5 rounded-[10px] px-3.5">
              <Timer className="text-fg-muted h-3.5 w-3.5" />
              <span className="text-fg text-base font-bold">
                {actualMinutes > 0 ? durationLabel(actualMinutes) : '-'}
              </span>
              <AutoLockChip />
            </span>
            <span className={HELPER}>
              시작·종료 시각으로 자동 계산 · 시간 차감 기준
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 장소 유형 — 세그먼트 필 */}
          <div className="flex flex-col gap-1">
            <span className={FIELD_LABEL}>장소 유형 *</span>
            <div
              role="radiogroup"
              aria-label="장소 유형"
              className="flex flex-wrap items-center gap-2"
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
                    'flex items-center gap-1.5 rounded-[10px] px-3.5 py-2.5 text-[13px] whitespace-nowrap',
                    placeType === v
                      ? 'bg-brand text-on-color font-bold'
                      : 'border-border text-fg bg-surface hover:bg-surface-muted border font-medium',
                  )}
                >
                  {MENTORING_PLACE_TYPE_LABEL[v]}
                  {placeType === v && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="log-place" className={FIELD_LABEL}>
              상세 장소 *
            </label>
            <input
              id="log-place"
              {...register('placeDetail')}
              placeholder="플레이데이터 강남캠퍼스 · 세미나실 B"
              className={cn(INPUT_BOX, 'w-full')}
            />
            {errors.placeDetail && (
              <p className="text-danger text-[11px]">
                {errors.placeDetail.message}
              </p>
            )}
          </div>
        </div>

        {/* 참석 멘티 — 칩 토글 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className={FIELD_LABEL}>참석 멘티 *</span>
            <span className="text-success text-[11px] font-bold">
              {attendedIds.length} / {target?.members.length ?? 0}명 참석
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(target?.members ?? []).map((m) => {
              const selected = attendedIds.includes(m.studentId)
              return (
                <button
                  key={m.studentId}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleAttendee(m.studentId)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1',
                    selected
                      ? 'bg-success-bg border-success'
                      : 'border-border bg-surface opacity-60 hover:opacity-100',
                  )}
                >
                  <Avatar name={m.name} size={26} />
                  <span className="text-fg text-xs font-semibold">
                    {m.name}
                  </span>
                  <span className="bg-surface-muted text-fg-subtle rounded px-1 py-px text-[9px] font-bold">
                    {m.tagLabel ?? (m.role === 'pm' ? 'PM' : '팀원')}
                  </span>
                  {selected && <Check className="text-success h-3 w-3" />}
                </button>
              )
            })}
          </div>
          {errors.attendedIds && (
            <p className="text-danger text-[11px]">
              {errors.attendedIds.message}
            </p>
          )}
        </div>
      </section>

      {/* 수정 요청 사유 — 재제출 모드 컨텍스트(운영자 수정 요청 응답) */}
      {mode === 'resubmit' && detail?.changeRequest && (
        <section className="bg-danger-bg border-danger flex items-start gap-2.5 rounded-2xl border p-4">
          <AlertTriangle className="text-danger mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-fg text-[13px] font-bold">
              운영자 수정 요청 — {detail.changeRequest.reasonLabel}
            </span>
            <span className="text-fg-muted text-xs leading-[18px]">
              {detail.changeRequest.note}
            </span>
            <span className="text-fg-subtle text-[11px]">
              요청 {detail.changeRequest.requestedAtLabel} · 전체 수정 후 재제출
              시 즉시 자동 유효 · 재제출 전까지 기존 유효본 인정 유지
            </span>
          </div>
        </section>
      )}

      {/* 시간 차감 자동 산정 — brand 틴트(#e8f7f7→brand/10) */}
      <section className="bg-brand/10 border-brand flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4">
        <div className="flex items-center gap-3">
          <span className="bg-surface text-brand flex h-11 w-11 items-center justify-center rounded-xl">
            <Clock className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-fg text-sm font-bold">
              시간 차감 자동 산정
            </span>
            <span className="text-fg-muted text-[11px]">
              실제 진행 시간 기준으로 인정·초과 시간을 자동 계산합니다
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <CalcStat
            label="실제 진행"
            value={actualMinutes > 0 ? `${round1(actualMinutes / 60)}h` : '-'}
          />
          <CalcDivider />
          <CalcStat
            label="인정 시간"
            value={actualMinutes > 0 ? `${recognizedPreview}h` : '-'}
            valueClass="text-success"
          />
          <CalcDivider />
          <CalcStat
            label="초과"
            value={excessPreview > 0 ? `${excessPreview}h` : '-'}
            valueClass={
              excessPreview > 0 ? 'text-accent-strong' : 'text-fg-subtle'
            }
          />
          <CalcDivider />
          <CalcStat
            label="배정 잔여"
            value={
              actualMinutes > 0
                ? `${remainingHours}h → ${afterRemaining}h`
                : `${remainingHours}h`
            }
            valueClass="text-warning"
          />
        </div>
      </section>

      {/* 운영 설정 항목 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-fg text-lg font-bold">운영 설정 항목</h3>
          <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
            팀 템플릿 {fields.length}개 · 필수 {requiredFields.length} · 선택{' '}
            {fields.length - requiredFields.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowTemplate(true)}
          className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          <FileText className="h-3 w-3" />
          적용된 템플릿 보기
        </button>
      </div>

      {fieldsQuery.isPending && (
        <div className="text-fg-muted text-sm">템플릿 항목을 불러오는 중…</div>
      )}

      {/* 텍스트 항목 에디터 — 템플릿 스냅샷 기반 동적 폼(멘토는 항목 편집 불가) */}
      {textFields.map((field) => {
        const value = answers?.[field.fieldSnapshotId] ?? ''
        const error = errors.answers?.[field.fieldSnapshotId]
        return (
          <section
            key={field.fieldSnapshotId}
            className="border-border bg-surface flex flex-col gap-2.5 rounded-2xl border p-5 shadow-[0_2px_8px_rgba(18,23,38,0.04)]"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-[22px] w-[22px] items-center justify-center rounded-md text-[11px] font-bold',
                  field.required
                    ? 'bg-brand/10 text-brand'
                    : 'bg-surface-muted text-fg-muted',
                )}
              >
                {field.order}
              </span>
              <span className="text-fg text-sm font-bold">{field.name}</span>
              <RequiredChip required={field.required} />
              <span className="ml-auto">
                <CharCounter
                  length={value.length}
                  limit={field.charLimit}
                  over={
                    field.charLimit != null && value.length > field.charLimit
                  }
                />
              </span>
            </div>
            <p className="text-fg-subtle text-[11px]">{field.description}</p>
            <textarea
              aria-label={field.name}
              rows={field.charLimit != null && field.charLimit > 1000 ? 10 : 5}
              {...register(`answers.${field.fieldSnapshotId}` as const)}
              placeholder={field.description}
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand w-full resize-y rounded-[10px] border px-4 py-3 text-[13px] leading-5 font-medium outline-none"
            />
            {error && (
              <p className="text-danger text-[11px]">{String(error.message)}</p>
            )}
          </section>
        )
      })}

      {/* 작성 산출물 — 드롭존(업로드 계약 미확정: 파일명 표시 전용) */}
      {filesField && (
        <section className="border-border bg-surface flex flex-col gap-2.5 rounded-2xl border p-5 shadow-[0_2px_8px_rgba(18,23,38,0.04)]">
          <div className="flex items-center gap-2">
            <span className="bg-surface-muted text-fg-muted flex h-[22px] w-[22px] items-center justify-center rounded-md text-[11px] font-bold">
              {filesField.order}
            </span>
            <span className="text-fg text-sm font-bold">{filesField.name}</span>
            <RequiredChip required={false} />
          </div>
          <p className="text-fg-subtle text-[11px]">{filesField.description}</p>
          <label className="border-border hover:bg-surface-muted flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-[10px] border border-dashed px-4 py-3.5">
            <span className="flex items-center gap-3">
              <span className="bg-surface-muted text-fg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                <Upload className="h-4 w-4" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-fg text-[13px] font-semibold">
                  파일·문서를 끌어 놓거나 클릭해 업로드
                </span>
                <span className="text-fg-subtle text-[11px]">
                  PDF · DOC · PPT · MD · 이미지 (최대 50MB · 5개)
                </span>
              </span>
            </span>
            <span className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-xs font-medium">
              파일 선택
            </span>
            <input
              type="file"
              multiple
              aria-label="작성 산출물 파일 선택"
              className="hidden"
              onChange={(e) => {
                const names = [...(e.target.files ?? [])].map((f) => f.name)
                setArtifactNames((prev) => [...prev, ...names].slice(0, 5))
              }}
            />
          </label>
          {artifactNames.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {artifactNames.map((name) => (
                <li
                  key={name}
                  className="bg-surface-muted text-fg-muted rounded px-2 py-0.5 text-[11px] font-medium"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 활동 기록 — 타임스탬프 사진(기존 메타 표시 + 추가는 표시 전용) */}
      {photosField && (
        <section className="border-border bg-surface flex flex-col gap-2.5 rounded-2xl border p-5 shadow-[0_2px_8px_rgba(18,23,38,0.04)]">
          <div className="flex items-center gap-2">
            <span className="bg-surface-muted text-fg-muted flex h-[22px] w-[22px] items-center justify-center rounded-md text-[11px] font-bold">
              {photosField.order}
            </span>
            <span className="text-fg text-sm font-bold">
              {photosField.name}
            </span>
            <RequiredChip required={false} />
            {(detail?.photos.length ?? 0) > 0 && (
              <span className="text-fg-subtle ml-auto text-[11px]">
                {detail!.photos.length}장 · 타임스탬프 확인됨
              </span>
            )}
          </div>
          <p className="text-fg-subtle text-[11px]">
            {photosField.description}
          </p>
          <div className="flex flex-wrap gap-3">
            {(detail?.photos ?? []).map((photo) => (
              <div
                key={`${photo.kind}-${photo.timeLabel}`}
                className="bg-brand-deep flex h-[120px] w-[200px] flex-col justify-end rounded-xl p-2.5"
              >
                <span className="text-on-color/70 text-[9px] font-bold tracking-[0.72px]">
                  TIME STAMP
                </span>
                <span className="text-on-color/80 text-[10px]">
                  {photo.dateLabel}
                </span>
                <span className="text-on-color text-[13px] font-bold">
                  {photo.timeLabel} ({photo.kind === 'start' ? '시작' : '종료'})
                </span>
              </div>
            ))}
            <label className="border-border hover:bg-surface-muted flex h-[120px] w-[200px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed">
              <span className="bg-surface-muted text-fg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                <Plus className="h-4 w-4" />
              </span>
              <span className="text-fg text-xs font-semibold">사진 추가</span>
              <span className="text-fg-subtle text-[10px]">
                타임스탬프 권장
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                aria-label="활동 기록 사진 추가"
                className="hidden"
                onChange={(e) => {
                  const names = [...(e.target.files ?? [])].map((f) => f.name)
                  setPhotoNames((prev) => [...prev, ...names])
                }}
              />
            </label>
          </div>
          {photoNames.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {photoNames.map((name) => (
                <li
                  key={name}
                  className="bg-surface-muted text-fg-muted rounded px-2 py-0.5 text-[11px] font-medium"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 하단 액션바 — brand-deep */}
      <section className="bg-brand-deep text-on-color flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 shadow-[0_8px_24px_rgba(18,23,38,0.18)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold">
            필수 항목 {requiredDone} / {requiredFields.length || 3} 작성
            {actualMinutes > 0
              ? ` · 인정 시간 ${recognizedPreview}h 자동 산정`
              : ''}
          </span>
          <span className="text-on-color/70 text-[11px]">
            {LOG_SUBMIT_POLICY_CAPTION}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mode !== 'resubmit' && (
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
            type="submit"
            disabled={saving}
            className="bg-brand text-on-color hover:bg-brand/90 flex items-center gap-1.5 rounded-[10px] px-5 py-2.5 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === 'resubmit' ? '일지 재제출' : '일지 제출'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* 적용된 템플릿 보기 — 항목 정의 조회(멘토는 편집 불가) */}
      <Modal
        open={showTemplate}
        onClose={() => setShowTemplate(false)}
        title="적용된 템플릿"
        footer={
          <button
            type="button"
            onClick={() => setShowTemplate(false)}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-[13px] font-medium"
          >
            닫기
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-fg-muted text-xs">
            팀에 적용된 운영 설정 항목 스냅샷입니다 · 항목 변경은 운영자만
            가능하며 새 일지부터 적용됩니다
          </p>
          <ul className="border-border divide-divider flex flex-col divide-y rounded-xl border">
            {fields.map((field) => (
              <li
                key={field.fieldSnapshotId}
                className="flex items-center gap-2 px-4 py-2.5"
              >
                <span className="text-fg-subtle w-4 text-[11px] font-bold">
                  {field.order}
                </span>
                <span className="text-fg text-[13px] font-semibold">
                  {field.name}
                </span>
                <RequiredChip required={field.required} />
                <span className="text-fg-subtle ml-auto text-[11px]">
                  {field.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </form>
  )
}

/** 자동 산정 잠금 칩 — Figma 의 x-circle 아이콘은 의미상 lock 으로 대체(openQuestion 기록). */
function AutoLockChip() {
  return (
    <span className="border-border text-fg-subtle ml-auto flex items-center gap-0.5 rounded border px-1 py-px text-[9px] font-bold">
      <Lock className="h-2.5 w-2.5" />
      자동
    </span>
  )
}

function CalcStat({
  label,
  value,
  valueClass = 'text-fg',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-fg-subtle text-[10px] font-medium tracking-[0.8px]">
        {label}
      </span>
      <span className={cn('text-xl font-bold', valueClass)}>{value}</span>
    </div>
  )
}

function CalcDivider() {
  return <span className="bg-brand/30 hidden h-8 w-px sm:block" aria-hidden />
}
