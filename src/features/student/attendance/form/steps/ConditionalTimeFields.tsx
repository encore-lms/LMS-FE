import type { ReactNode } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { cn } from '@/shared/lib/cn'
import type { AttendanceType } from '../../types'
import type { AttendanceFormValues } from '../attendanceFormSchema'
import { DateTimePicker } from '@/components/ui/DateTimePicker'

// 유형별 조건부 입력 — 선택한 출결 유형에 맞는 시간/사유 입력만 노출(나머지는 언마운트).
// 시간은 공용 DateTimePicker(mode="time", 분 단위 정밀)로 입력. 라벨 옆 '필수' 배지는 Figma 시안과 동일.
function RequiredBadge() {
  return (
    <span className="bg-danger-bg text-danger rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
      필수
    </span>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-fg text-[13px] font-bold">{children}</span>
      <RequiredBadge />
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-danger mt-1 text-xs">{message}</p>
}

type TimeFieldName =
  | 'expectedArrivalTime'
  | 'expectedLeaveTime'
  | 'outingStartTime'
  | 'outingEndTime'

// 시간 입력 한 칸 — Controller로 공용 DateTimePicker를 폼에 연결.
function TimeField({
  name,
  label,
  className,
}: {
  name: TimeFieldName
  label: string
  className?: string
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<AttendanceFormValues>()
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <FieldLabel>{label}</FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DateTimePicker
            mode="time"
            minuteStep={1}
            value={field.value ?? ''}
            onChange={field.onChange}
            error={errors[name]?.message}
            ariaLabel={label}
          />
        )}
      />
    </div>
  )
}

export function ConditionalTimeFields({ type }: { type: AttendanceType }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AttendanceFormValues>()

  return (
    <div className="bg-surface-muted flex flex-col gap-3 rounded-xl p-4">
      {type === 'LATE' && (
        <TimeField name="expectedArrivalTime" label="예상 입실 시간" />
      )}

      {type === 'EARLY_LEAVE' && (
        <TimeField name="expectedLeaveTime" label="예상 조퇴 시간" />
      )}

      {type === 'OUTING' && (
        <div className="flex flex-wrap gap-3">
          <TimeField
            name="outingStartTime"
            label="외출 시작 시간"
            className="flex-1 basis-48"
          />
          <TimeField
            name="outingEndTime"
            label="복귀 시간"
            className="flex-1 basis-48"
          />
        </div>
      )}

      {type === 'ABSENT' && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>결석 사유</FieldLabel>
          <textarea
            rows={3}
            placeholder="결석 사유를 입력하세요"
            className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white px-4 py-3 text-[15px] outline-none focus-visible:shadow-none"
            {...register('note')}
          />
          <FieldError message={errors.note?.message} />
        </div>
      )}

      <p className="text-fg-subtle text-xs">
        유형을 바꾸면 입력 항목도 함께 바뀝니다.
      </p>
    </div>
  )
}
