import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/inputClass'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import { apiErrorOf, useCreateMentorAssignment } from './api'
import { assignmentSchema, type AssignmentInput } from './assignmentSchema'
import type { MentorAssignmentsData } from './types'

const FIELD_LABEL = 'text-fg-muted text-xs font-bold'
const INPUT_CLASS = inputClass()
const ERROR_CLASS = 'text-danger text-xs'

interface AssignmentFormModalProps {
  open: boolean
  onClose: () => void
  data: MentorAssignmentsData
  /** 행 '배정' 버튼 진입 — 해당 팀 선선택(반 자동 결정) */
  presetTeamId?: string | null
}

/**
 * 새 배정 추가 / 미배정 팀 배정 모달 — 반→팀→멘토·N시간(RHF+Zod 선차단).
 * 서버 게이트(§29): 같은 반 중복 409 · N시간 422 · 활성 템플릿이 있으면 템플릿 422.
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
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
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
    if (data.templates.length > 0 && !values.logTemplateId) {
      setError('logTemplateId', {
        type: 'manual',
        message: '일지 템플릿을 선택해주세요',
      })
      return
    }
    createAssignment.mutate(
      {
        teamId: values.teamId,
        mentorId: values.mentorId,
        allocatedHours: values.allocatedHours,
        logTemplateId: values.logTemplateId || undefined,
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
          <Button variant="secondary" onClick={close}>
            취소
          </Button>
          <Button
            type="submit"
            form="assignment-form"
            disabled={createAssignment.isPending}
          >
            {createAssignment.isPending ? '저장 중…' : '배정 저장'}
          </Button>
        </>
      }
    >
      <form
        id="assignment-form"
        onSubmit={handleSubmit(onValid)}
        className="flex flex-col gap-4"
      >
        <p className="bg-brand/10 text-brand rounded-lg px-3 py-2 text-xs font-medium">
          한 반에 한 팀만 배정 · 저장 전 자동 검증 — 같은 반 중복 배정·미배정 팀
          미선택 차단 · 템플릿이 있으면 선택 필수
        </p>
        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>반/기수 *</span>
          <Controller
            name="cohortId"
            control={control}
            render={({ field }) => (
              <Select
                aria-label="반/기수"
                value={field.value}
                onChange={(v) => {
                  field.onChange(v)
                  setValue('teamId', '')
                }}
                options={[
                  { value: '', label: '반 선택' },
                  ...data.cohorts.map((c) => ({
                    value: c.cohortId,
                    label: `${c.cohortName} (${c.courseName})`,
                  })),
                ]}
                className="h-10 w-full"
              />
            )}
          />
          {errors.cohortId && (
            <p className={ERROR_CLASS}>{errors.cohortId.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>팀 *</span>
          <Controller
            name="teamId"
            control={control}
            render={({ field }) => (
              <Select
                aria-label="팀"
                disabled={!cohortId}
                value={field.value}
                onChange={field.onChange}
                options={[
                  {
                    value: '',
                    label: cohortId ? '팀 선택' : '반을 먼저 선택해주세요',
                  },
                  ...teamOptions.map((r) => ({
                    value: r.teamId,
                    label: `${r.teamName} · ${r.memberCount}명`,
                  })),
                ]}
                className="h-10 w-full"
              />
            )}
          />
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
          <span className={FIELD_LABEL}>멘토 *</span>
          <Controller
            name="mentorId"
            control={control}
            render={({ field }) => (
              <Select
                aria-label="멘토"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: '', label: '멘토 선택' },
                  ...data.mentors.map((m) => ({
                    value: m.mentorId,
                    label: m.name,
                  })),
                ]}
                className="h-10 w-full"
              />
            )}
          />
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
          <span className={FIELD_LABEL}>
            기본 일지 템플릿{data.templates.length > 0 ? ' *' : ''}
          </span>
          <Controller
            name="logTemplateId"
            control={control}
            render={({ field }) => (
              <Select
                aria-label="기본 일지 템플릿"
                disabled={data.templates.length === 0}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="활성 템플릿 없음"
                options={
                  data.templates.length === 0
                    ? []
                    : [
                        { value: '', label: '템플릿 선택' },
                        ...data.templates.map((t) => ({
                          value: t.templateId,
                          label: `${t.name}${t.isDefault ? ' (기본)' : ''}`,
                        })),
                      ]
                }
                className="h-10 w-full"
              />
            )}
          />
          <p className="text-fg-subtle text-xs">
            {data.templates.length === 0
              ? '일지 항목 없이 먼저 배정합니다'
              : '배정 시 기본 템플릿 선택 (일지 템플릿에서 관리)'}
          </p>
          {errors.logTemplateId && (
            <p className={ERROR_CLASS}>{errors.logTemplateId.message}</p>
          )}
        </div>
      </form>
    </Modal>
  )
}
