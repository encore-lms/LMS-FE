import type { ReactNode } from 'react'
import { useFormContext } from 'react-hook-form'
import type { AttendanceType } from '../../types'
import type { AttendanceFormValues } from '../attendanceFormSchema'

// 유형별 조건부 입력 — 선택한 출결 유형에 맞는 시간/사유 입력만 노출(나머지는 언마운트).
// 라벨 옆 '필수' 배지는 Figma 시안과 동일하게 노출(공유 Input의 * 표기 대신).
const inputClass =
  'border-border focus:border-brand text-fg placeholder:text-fg-subtle h-[52px] w-full rounded-[10px] border-2 bg-white px-4 text-[15px] font-medium outline-none'

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

export function ConditionalTimeFields({ type }: { type: AttendanceType }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AttendanceFormValues>()

  return (
    <div className="bg-surface-muted flex flex-col gap-3 rounded-xl p-4">
      {type === 'LATE' && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>예상 입실 시간</FieldLabel>
          <input
            type="time"
            className={inputClass}
            {...register('expectedArrivalTime')}
          />
          <FieldError message={errors.expectedArrivalTime?.message} />
        </div>
      )}

      {type === 'EARLY_LEAVE' && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>예상 조퇴 시간</FieldLabel>
          <input
            type="time"
            className={inputClass}
            {...register('expectedLeaveTime')}
          />
          <FieldError message={errors.expectedLeaveTime?.message} />
        </div>
      )}

      {type === 'OUTING' && (
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-1 basis-48 flex-col gap-1.5">
            <FieldLabel>외출 시작 시간</FieldLabel>
            <input
              type="time"
              className={inputClass}
              {...register('outingStartTime')}
            />
            <FieldError message={errors.outingStartTime?.message} />
          </div>
          <div className="flex flex-1 basis-48 flex-col gap-1.5">
            <FieldLabel>복귀 시간</FieldLabel>
            <input
              type="time"
              className={inputClass}
              {...register('outingEndTime')}
            />
            <FieldError message={errors.outingEndTime?.message} />
          </div>
        </div>
      )}

      {type === 'ABSENT' && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>결석 사유</FieldLabel>
          <textarea
            rows={3}
            placeholder="결석 사유를 입력하세요"
            className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white px-4 py-3 text-[15px] outline-none"
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
