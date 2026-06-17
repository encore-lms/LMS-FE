import { type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/shared/lib/cn'
import { DateTimePicker } from '@/components/ui/DateTimePicker'

// 새 멘토링 요청 폼.
// - disabled(진행 중 요청 1건 / 멘토 미배정): 읽기 전용 placeholder 표시.
// - 활성: 실제 입력 폼(RHF + Zod). 희망 일정은 공용 DateTimePicker(날짜 1 + 시작/종료 시각 2)로 입력.
//   제출하면 onSubmit 으로 값 전달 → 부모가 요청 생성 + 토스트.

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

const fieldCls =
  'bg-surface border-border text-fg placeholder:text-fg-subtle focus:border-brand h-[42px] w-full rounded-lg border px-3 text-[13px] outline-none'

export function NewRequestForm({
  disabled,
  variant = 'active',
  onSubmit,
}: {
  disabled: boolean
  variant?: 'active' | 'no-mentor'
  onSubmit?: (values: NewRequestValues) => void
}) {
  if (disabled) return <ReadOnlyForm variant={variant} />
  return <EditableForm onSubmit={onSubmit} />
}

/* ---------------- 읽기 전용(비활성) ---------------- */

function ReadOnlyField({
  label,
  placeholder,
  required,
}: {
  label: string
  placeholder: string
  required?: boolean
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <FieldLabel label={label} required={required} />
      <div className="bg-surface-muted border-border flex h-[42px] items-center rounded-lg border px-3">
        <span className="text-fg-subtle text-[13px] font-medium">
          {placeholder}
        </span>
      </div>
    </div>
  )
}

function ReadOnlyForm({ variant }: { variant: 'active' | 'no-mentor' }) {
  const noMentor = variant === 'no-mentor'
  const title = noMentor ? '멘토 배정 후 요청 가능' : '새 멘토링 요청'
  const chip = noMentor
    ? '⊘ 비활성 — 멘토 미배정'
    : '⊘ 비활성 — 진행 중 요청 1건 존재'
  const sub = noMentor
    ? '운영자가 멘토를 배정하면 요청 버튼이 활성화됩니다'
    : '팀당 진행 중 요청은 1개만 허용 · 현재 요청 응답 후 다시 요청 가능'
  return (
    <FormShell title={title} sub={sub} chip={chip} disabled>
      <ReadOnlyField
        label="희망 일정"
        placeholder="날짜·시작 시각·종료 시각 선택"
        required
      />
      <div className="flex flex-col gap-3.5 sm:flex-row">
        <ReadOnlyField
          label="장소 유형"
          placeholder="오프라인 / 온라인 / 기타 중 선택"
          required
        />
        <ReadOnlyField
          label="상세 장소"
          placeholder="Zoom 링크 · 강의장 · Discord 채널 등"
          required
        />
      </div>
      <ReadOnlyField
        label="요청 메모"
        placeholder="이번 멘토링에서 다루고 싶은 안건을 간단히 작성 (선택)"
      />
    </FormShell>
  )
}

/* ---------------- 활성(입력) ---------------- */

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

function EditableForm({
  onSubmit,
}: {
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
    <form onSubmit={handleSubmit((v) => onSubmit?.(v))}>
      <FormShell
        title="새 멘토링 요청"
        sub="팀당 진행 중 요청은 1개만 허용 · 현재 요청 응답 후 다시 요청 가능"
        footer={
          <button
            type="submit"
            className="bg-brand rounded-[9px] px-[18px] py-[9px] text-[13px] font-bold text-white"
          >
            요청 제출
          </button>
        }
      >
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
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <FormField
            label="장소 유형"
            required
            error={errors.placeType?.message}
          >
            <select
              {...register('placeType')}
              defaultValue=""
              className={fieldCls}
            >
              <option value="" disabled>
                오프라인 / 온라인 / 기타 중 선택
              </option>
              <option value="오프라인">오프라인</option>
              <option value="온라인">온라인</option>
              <option value="기타">기타</option>
            </select>
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
      </FormShell>
    </form>
  )
}

/* ---------------- 공통 셸 ---------------- */

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

function FormShell({
  title,
  sub,
  chip,
  disabled,
  footer,
  children,
}: {
  title: string
  sub: string
  chip?: string
  disabled?: boolean
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'border-border bg-surface overflow-hidden rounded-2xl border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex flex-col gap-0.5 px-6 pt-[18px] pb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-fg text-[15px] font-bold">{title}</span>
          {chip && (
            <span className="bg-surface-muted text-fg-subtle flex items-center gap-1 rounded-[5px] px-[7px] py-[3px] text-[10px] font-bold">
              {chip}
            </span>
          )}
        </div>
        <span className="text-fg-subtle text-[11px]">{sub}</span>
      </div>
      <div className="flex flex-col gap-3.5 px-6 pt-2 pb-5">{children}</div>
      <div className="border-divider flex items-center justify-between border-t px-6 pt-3.5 pb-[18px]">
        <span className="text-fg-subtle text-[11px] font-medium">
          팀원 누구나 요청 가능 · 요청자는 기록 · 확정 전까지 수강생 취소 가능
        </span>
        {footer ?? (
          <span className="bg-surface-muted text-fg-subtle rounded-[9px] px-[18px] py-[9px] text-[13px] font-bold">
            요청 제출 (비활성)
          </span>
        )}
      </div>
    </section>
  )
}
