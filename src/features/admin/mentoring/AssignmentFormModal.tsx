import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { apiErrorOf, useCreateMentorAssignment } from './api'
import { assignmentSchema, type AssignmentInput } from './assignmentSchema'
import type { MentorAssignmentsData } from './types'

const FIELD_LABEL = 'text-fg-muted text-xs font-bold'
const INPUT_CLASS =
  'border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border px-3 text-sm outline-none'
const ERROR_CLASS = 'text-danger text-xs'

interface AssignmentFormModalProps {
  open: boolean
  onClose: () => void
  data: MentorAssignmentsData
  /** 행 '배정' 버튼 진입 — 해당 팀 선선택(반 자동 결정) */
  presetTeamId?: string | null
}

/**
 * 새 배정 추가 / 미배정 팀 배정 모달 — 반→팀→멘토·N시간·기본 템플릿 필수(RHF+Zod 선차단).
 * 서버 게이트(§29): 같은 반 중복 409 · N시간 422 · 템플릿 422 — 응답 message 토스트.
 */
export function AssignmentFormModal({
  open,
  onClose,
  data,
  presetTeamId,
}: AssignmentFormModalProps) {
  const toast = useToast()
  const createAssignment = useCreateMentorAssignment()
  const presetRow = presetTeamId
    ? (data.rows.find((r) => r.teamId === presetTeamId) ?? null)
    : null
  const defaultTemplate =
    data.templates.find((t) => t.isDefault)?.templateId ?? ''

  // 부모가 열림 상태에서만 마운트(조건부 렌더) — 닫고 다시 열면 새 기본값으로 초기화된다.
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      cohortId: presetRow?.cohortId ?? '',
      teamId: presetRow?.teamId ?? '',
      mentorId: '',
      // 빈 입력 → zod coerce 0 → positive 위반 메시지로 선차단
      allocatedHours: '' as unknown as number,
      logTemplateId: defaultTemplate,
    },
  })

  const cohortId = watch('cohortId')
  // 선택한 반의 미배정 팀만 — 한 반에 한 팀만 배정(이미 배정된 팀은 수정/교체 경로).
  const teamOptions = useMemo(
    () =>
      data.rows.filter(
        (r) =>
          r.cohortId === cohortId &&
          (!r.assignmentId || r.teamId === presetTeamId),
      ),
    [data.rows, cohortId, presetTeamId],
  )

  const close = () => {
    reset()
    onClose()
  }

  const onValid = (values: AssignmentInput) => {
    createAssignment.mutate(
      {
        teamId: values.teamId,
        mentorId: values.mentorId,
        allocatedHours: values.allocatedHours,
        logTemplateId: values.logTemplateId,
      },
      {
        onSuccess: (row) => {
          toast.success(
            `배정 완료 — ${row.teamName} · ${row.mentor?.name} · ${row.allocatedHours}h`,
          )
          close()
        },
        onError: (error) => {
          const { code, message } = apiErrorOf(error)
          if (code === 'MENTOR_ASSIGNMENT_DUPLICATED_COHORT') {
            toast.danger(message ?? '같은 반 중복 배정 — 저장 차단')
          } else {
            toast.danger(
              message ?? '배정에 실패했어요 — 잠시 후 다시 시도해 주세요.',
            )
          }
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="새 배정 추가"
      closeOnBackdrop={false}
      footer={
        <>
          <button
            type="button"
            onClick={close}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-sm font-bold"
          >
            취소
          </button>
          <button
            type="submit"
            form="assignment-form"
            disabled={createAssignment.isPending}
            className="bg-brand-deep text-on-color hover:bg-brand-deep/90 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createAssignment.isPending ? '저장 중…' : '배정 저장'}
          </button>
        </>
      }
    >
      <form
        id="assignment-form"
        onSubmit={handleSubmit(onValid)}
        className="flex flex-col gap-4"
      >
        <p className="bg-brand/10 text-brand rounded-lg px-3 py-2 text-xs font-medium">
          한 반에 한 팀만 배정 · 저장 전 자동 검증 — 같은 반 중복 배정·미배정
          팀·템플릿 미선택 차단
        </p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assignment-cohort" className={FIELD_LABEL}>
            반/기수 *
          </label>
          <select
            id="assignment-cohort"
            className={INPUT_CLASS}
            {...register('cohortId', {
              onChange: () => setValue('teamId', ''),
            })}
          >
            <option value="">반 선택</option>
            {data.cohorts.map((c) => (
              <option key={c.cohortId} value={c.cohortId}>
                {c.cohortName} ({c.courseName})
              </option>
            ))}
          </select>
          {errors.cohortId && (
            <p className={ERROR_CLASS}>{errors.cohortId.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assignment-team" className={FIELD_LABEL}>
            팀 *
          </label>
          <select
            id="assignment-team"
            className={INPUT_CLASS}
            disabled={!cohortId}
            {...register('teamId')}
          >
            <option value="">
              {cohortId ? '팀 선택' : '반을 먼저 선택해주세요'}
            </option>
            {teamOptions.map((r) => (
              <option key={r.teamId} value={r.teamId}>
                {r.teamName} · {r.memberCount}명
              </option>
            ))}
          </select>
          {cohortId && teamOptions.length === 0 && (
            <p className="text-fg-subtle text-xs">
              이 반에는 배정 가능한 미배정 팀이 없어요 — 한 반에 한 팀만 배정
            </p>
          )}
          {errors.teamId && (
            <p className={ERROR_CLASS}>{errors.teamId.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assignment-mentor" className={FIELD_LABEL}>
            멘토 *
          </label>
          <select
            id="assignment-mentor"
            className={INPUT_CLASS}
            {...register('mentorId')}
          >
            <option value="">멘토 선택</option>
            {data.mentors.map((m) => (
              <option key={m.mentorId} value={m.mentorId}>
                {m.name}
              </option>
            ))}
          </select>
          {errors.mentorId && (
            <p className={ERROR_CLASS}>{errors.mentorId.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assignment-hours" className={FIELD_LABEL}>
            배정 N시간 *
          </label>
          <input
            id="assignment-hours"
            type="number"
            min={0.5}
            step={0.5}
            placeholder="예: 10"
            className={INPUT_CLASS}
            {...register('allocatedHours')}
          />
          <p className="text-fg-subtle text-xs">팀 배정 단위로 설정</p>
          {errors.allocatedHours && (
            <p className={ERROR_CLASS}>{errors.allocatedHours.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assignment-template" className={FIELD_LABEL}>
            기본 일지 템플릿 *
          </label>
          <select
            id="assignment-template"
            className={INPUT_CLASS}
            {...register('logTemplateId')}
          >
            <option value="">템플릿 선택</option>
            {data.templates.map((t) => (
              <option key={t.templateId} value={t.templateId}>
                {t.name}
                {t.isDefault ? ' (기본)' : ''}
              </option>
            ))}
          </select>
          <p className="text-fg-subtle text-xs">
            배정 시 기본 템플릿 선택 (일지 템플릿에서 관리)
          </p>
          {errors.logTemplateId && (
            <p className={ERROR_CLASS}>{errors.logTemplateId.message}</p>
          )}
        </div>
      </form>
    </Modal>
  )
}
