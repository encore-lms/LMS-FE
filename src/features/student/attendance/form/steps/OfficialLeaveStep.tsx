import { useFormContext, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { cn } from '@/shared/lib/cn'
import { OFFICIAL_LEAVE_TYPE_OPTIONS } from '../../attendanceConstants'
import type { AttendanceFormValues } from '../attendanceFormSchema'

// Step 2 — 공가 사용 보조 토글. 사용 시 공가 유형 5종 칩, OTHER 시 기타 사유 입력.
const TOGGLE = [
  { value: true, label: '사용' },
  { value: false, label: '미사용' },
]

export function OfficialLeaveStep() {
  const {
    control,
    setValue,
    register,
    formState: { errors },
  } = useFormContext<AttendanceFormValues>()
  const used = useWatch({ control, name: 'officialLeaveUsed' })
  const type = useWatch({ control, name: 'officialLeaveType' })

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface-muted inline-flex w-fit gap-1 rounded-lg p-1">
        {TOGGLE.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() =>
              setValue('officialLeaveUsed', opt.value, {
                shouldValidate: false,
              })
            }
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              used === opt.value
                ? 'text-fg bg-white shadow-sm'
                : 'text-fg-muted',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {used && (
        <div className="flex flex-col gap-3">
          <span className="text-fg text-[13px] font-bold">공가 유형</span>
          <div className="flex flex-wrap gap-2">
            {OFFICIAL_LEAVE_TYPE_OPTIONS.map((opt) => {
              const active = type === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setValue('officialLeaveType', opt.value, {
                      shouldValidate: false,
                    })
                  }
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-brand bg-brand text-white'
                      : 'border-border text-fg hover:border-fg-subtle',
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          {errors.officialLeaveType?.message && (
            <p className="text-danger text-xs">
              {errors.officialLeaveType.message}
            </p>
          )}

          {type === 'OTHER' && (
            <div>
              <Input
                label="기타 사유"
                required
                placeholder="공가 사유를 입력하세요"
                {...register('officialLeaveOtherReason')}
              />
              {errors.officialLeaveOtherReason?.message && (
                <p className="text-danger mt-1 text-xs">
                  {errors.officialLeaveOtherReason.message}
                </p>
              )}
            </div>
          )}

          <p className="text-fg-subtle text-xs">
            ‘기타’ 선택 시 사유 직접 입력 항목이 추가됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
