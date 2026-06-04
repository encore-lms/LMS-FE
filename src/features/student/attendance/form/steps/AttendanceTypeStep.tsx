import { useFormContext, useWatch } from 'react-hook-form'
import { ATTENDANCE_TYPE_OPTIONS } from '../../attendanceConstants'
import type { AttendanceFormValues } from '../attendanceFormSchema'
import { AttendanceTypeOption } from './AttendanceTypeOption'
import { ConditionalTimeFields } from './ConditionalTimeFields'

// Step 1 — 출결 유형 4종 라디오 + 선택 유형별 조건부 입력.
export function AttendanceTypeStep() {
  const { control, setValue } = useFormContext<AttendanceFormValues>()
  const selected = useWatch({ control, name: 'attendanceType' })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {ATTENDANCE_TYPE_OPTIONS.map((opt) => (
          <AttendanceTypeOption
            key={opt.value}
            label={opt.label}
            hint={opt.hint}
            selected={selected === opt.value}
            onSelect={() =>
              setValue('attendanceType', opt.value, { shouldValidate: false })
            }
          />
        ))}
      </div>
      <ConditionalTimeFields type={selected} />
    </div>
  )
}
