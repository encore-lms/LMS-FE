import { useFormContext, useWatch } from 'react-hook-form'
import type { AttendanceFormValues } from '../attendanceFormSchema'
import { FormStepCard } from '../FormStepCard'

// Step 4 — 비고(선택). 결석은 1단계에서 사유를 받으므로 결석 선택 시 이 단계를 숨긴다.
export function NoteStep() {
  const { control, register } = useFormContext<AttendanceFormValues>()
  const type = useWatch({ control, name: 'attendanceType' })

  if (type === 'ABSENT') return null

  return (
    <FormStepCard step={4} title="비고" badge="optional">
      <textarea
        rows={3}
        placeholder="특이사항이 있으면 입력하세요 (선택)"
        className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white px-4 py-3 text-[15px] outline-none"
        {...register('note')}
      />
    </FormStepCard>
  )
}
