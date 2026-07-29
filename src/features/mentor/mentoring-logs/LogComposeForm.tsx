import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileText,
  Flag,
  Pencil,
  Send,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { useLogFieldSnapshot, useSubmitMentoringLog } from '../api/logs'
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
  LOG_SUBMIT_POLICY_CAPTION,
  durationLabel,
  minutesBetween,
} from './logMeta'
import type { LogSubmittedState } from './LogSubmittedPage'
import { dateWithDow, round1 } from './logComposeConstants'
import { LogArtifactsSection, LogPhotosSection } from './LogAttachmentSections'
import { LogBasicInfoSection, type ComposeMode } from './LogBasicInfoSection'
import { LogCalcSection } from './LogCalcSection'
import { LogTemplateModal } from './LogTemplateModal'

export function LogComposeForm({
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

  const [showTemplate, setShowTemplate] = useState(false)
  // 첨부·사진 — 업로드 계약 미확정(DB 스키마 갭 openQuestion)이라 파일명 표시 전용(payload 미포함)
  const [artifactNames, setArtifactNames] = useState<string[]>([])
  const [photoNames, setPhotoNames] = useState<string[]>([])

  const saving = submitMutation.isPending

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

  // 제출·재제출 — 성공 시 제출 완료 요약 페이지로 이동(요약은 navigate state 로 전달, 2582:6348)
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
          // 제출 = 신규 생성(승인 대기). 초안은 클라이언트 전용이라 선저장 없이 바로 생성.
          await submitMutation.mutateAsync({ mode: 'submit', payload })
        }
        const summaryRows = [
          {
            label: '대상 팀',
            value: target
              ? `${target.cohortLabel} · ${target.teamName} · ${round}회차`
              : '-',
          },
          {
            label: '진행 일시',
            value:
              (dateWithDow(values.sessionDate ?? '') || '-') +
              (values.startTime && values.endTime
                ? ` · ${values.startTime}~${values.endTime}`
                : ''),
          },
          {
            label: '장소',
            value: `${MENTORING_PLACE_TYPE_LABEL[values.placeType]}${
              values.placeDetail ? ` · ${values.placeDetail}` : ''
            }`,
          },
          {
            label: '실제 진행 시간',
            value: actualMinutes > 0 ? durationLabel(actualMinutes) : '-',
          },
          { label: '인정 시간', value: `${recognizedPreview}h` },
          { label: '참석 멘티', value: `${values.attendedIds.length}명` },
          { label: '상태', value: '제출 시 승인 대기' },
        ]
        navigate('/mentor/mentoring-logs/submitted', {
          state: {
            submittedAtLabel: '방금',
            resubmit: mode === 'resubmit',
            rows: summaryRows,
          } satisfies LogSubmittedState,
        })
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
          제출 시 매니저 승인 대기
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
      <LogBasicInfoSection
        mode={mode}
        targets={targets}
        target={target}
        teamId={teamId}
        round={round}
        sessionDate={sessionDate}
        startTime={startTime}
        endTime={endTime}
        placeType={placeType}
        attendedIds={attendedIds}
        actualMinutes={actualMinutes}
        register={register}
        setValue={setValue}
        errors={errors}
        onTeamChange={onTeamChange}
        toggleAttendee={toggleAttendee}
      />

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
              시 승인 대기 · 재제출 전까지 기존 유효본 인정 유지
            </span>
          </div>
        </section>
      )}

      {/* 시간 차감 자동 산정 — brand 틴트(#e8f7f7→brand/10) */}
      <LogCalcSection
        actualMinutes={actualMinutes}
        recognizedPreview={recognizedPreview}
        excessPreview={excessPreview}
        remainingHours={remainingHours}
        afterRemaining={afterRemaining}
      />

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
            className="bg-surface flex flex-col gap-2.5 rounded-2xl p-5 shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
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
        <LogArtifactsSection
          filesField={filesField}
          artifactNames={artifactNames}
          setArtifactNames={setArtifactNames}
        />
      )}

      {/* 활동 기록 — 타임스탬프 사진(기존 메타 표시 + 추가는 표시 전용) */}
      {photosField && (
        <LogPhotosSection
          photosField={photosField}
          detail={detail}
          photoNames={photoNames}
          setPhotoNames={setPhotoNames}
        />
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
      <LogTemplateModal
        showTemplate={showTemplate}
        setShowTemplate={setShowTemplate}
        fields={fields}
      />
    </form>
  )
}
