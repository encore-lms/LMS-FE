import { type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Select } from '@/components/ui/Select'
import { buttonClass } from '@/components/ui/buttonClass'

// 새 멘토링 요청 폼(팝업). 멘토링 기록 헤더의 "새 멘토링 요청" 버튼으로 열린다.
// 희망 일정은 공용 DateTimePicker(날짜 1 + 시작/종료 시각 2). 제출하면 onSubmit 으로 값 전달.
// 진행 중 요청 1건 한도·멘토 미배정 게이트는 부모(버튼 disabled)가 담당 — 모달은 항상 입력 가능 상태.

const schema = z
  .object({
    date: z.string().min(1, '날짜를 선택하세요'),
    startTime: z.string().min(1, '시작 시각을 선택하세요'),
    endTime: z.string().min(1, '종료 시각을 선택하세요'),
    placeType: z.string().min(1, '장소 유형을 선택하세요'),
    placeDetail: z.string().min(1, '상세 장소를 입력하세요'),
    memo: z.string().optional(),
  })
  .refine((v) => !v.startTime || !v.endTime || v.endTime > v.startTime, {
    path: ['endTime'],
    message: '종료 시각은 시작 시각보다 늦어야 합니다',
  })
export type NewRequestValues = z.infer<typeof schema>

const FORM_ID = 'mentoring-new-request'
const fieldCls =
  'bg-surface border-border text-fg placeholder:text-fg-subtle focus:border-brand h-[42px] w-full rounded-lg border px-3 text-[13px] outline-none focus-visible:shadow-none'

function FieldLabel({
  label,
  required,
}: {
  label: string
  required?: boolean
}) {
  return (
    <span className="flex items-center gap-1 text-[12px] font-bold">
      <span className="text-fg-muted">{label}</span>
      {required && <span className="text-danger text-[13px]">*</span>}
    </span>
  )
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <FieldLabel label={label} required={required} />
      {children}
      {error && <span className="text-danger text-[11px]">{error}</span>}
    </div>
  )
}

export function NewRequestModal({
  open,
  onClose,
  isSubmitting = false,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  isSubmitting?: boolean
  onSubmit?: (values: NewRequestValues) => void
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewRequestValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: '',
      startTime: '',
      endTime: '',
      placeType: '',
      placeDetail: '',
      memo: '',
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      title="새 멘토링 요청"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={buttonClass({ variant: 'secondary' })}
          >
            취소
          </button>
          <button
            type="submit"
            form={FORM_ID}
            disabled={isSubmitting}
            className={buttonClass()}
          >
            {isSubmitting ? '제출 중' : '요청 제출'}
          </button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit((v) => onSubmit?.(v))}
        className="flex flex-col gap-4"
      >
        <p className="text-fg-subtle text-[12px] leading-5">
          팀당 진행 중 요청은 1개만 허용 · 팀원 누구나 요청 가능 · 확정 전까지
          수강생이 취소할 수 있습니다.
        </p>
        <FormField
          label="희망 일정"
          required
          error={
            errors.date?.message ??
            errors.startTime?.message ??
            errors.endTime?.message
          }
        >
          <div className="flex flex-col gap-2">
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateTimePicker
                  mode="date"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="날짜 선택"
                  ariaLabel="희망 날짜"
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
                  />
                )}
              />
            </div>
          </div>
        </FormField>
        <div className="flex flex-col gap-4 sm:flex-row">
          <FormField
            label="장소 유형"
            required
            error={errors.placeType?.message}
          >
            <Controller
              control={control}
              name="placeType"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: '오프라인', label: '오프라인' },
                    { value: '온라인', label: '온라인' },
                    { value: '기타', label: '기타' },
                  ]}
                  placeholder="오프라인 / 온라인 / 기타 중 선택"
                  aria-label="장소 유형"
                  className="h-[42px] w-full"
                />
              )}
            />
          </FormField>
          <FormField
            label="상세 장소"
            required
            error={errors.placeDetail?.message}
          >
            <input
              {...register('placeDetail')}
              placeholder="Zoom 링크 · 강의장 · Discord 채널 등"
              className={fieldCls}
            />
          </FormField>
        </div>
        <FormField label="요청 메모" error={errors.memo?.message}>
          <input
            {...register('memo')}
            placeholder="이번 멘토링에서 다루고 싶은 안건을 간단히 작성 (선택)"
            className={fieldCls}
          />
        </FormField>
      </form>
    </Modal>
  )
}
