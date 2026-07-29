import { z } from 'zod'

// 출결 폼 Zod 스키마 — 유형별 조건부 필수를 superRefine으로 검증.
// LATE→예상입실, EARLY_LEAVE→예상조퇴, OUTING→외출/복귀, ABSENT→결석사유(note),
// 공가 사용 시 유형 필수, OTHER 시 기타 사유 필수.
const blank = (s?: string | null) => !s || !s.trim()

export const attendanceFormSchema = z
  .object({
    attendanceType: z.enum(['LATE', 'EARLY_LEAVE', 'OUTING', 'ABSENT']),
    expectedArrivalTime: z.string().optional(),
    expectedLeaveTime: z.string().optional(),
    outingStartTime: z.string().optional(),
    outingEndTime: z.string().optional(),
    officialLeaveUsed: z.boolean(),
    officialLeaveType: z
      .enum(['VACATION', 'SICK', 'INTERVIEW', 'RESERVE', 'OTHER'])
      .nullable(),
    officialLeaveOtherReason: z.string().optional(),
    note: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.attendanceType === 'LATE' && blank(value.expectedArrivalTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expectedArrivalTime'],
        message: '예상 입실 시간을 입력하세요',
      })
    }
    if (
      value.attendanceType === 'EARLY_LEAVE' &&
      blank(value.expectedLeaveTime)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expectedLeaveTime'],
        message: '예상 조퇴 시간을 입력하세요',
      })
    }
    if (value.attendanceType === 'OUTING') {
      if (blank(value.outingStartTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outingStartTime'],
          message: '외출 시작 시간을 입력하세요',
        })
      }
      if (blank(value.outingEndTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outingEndTime'],
          message: '복귀 시간을 입력하세요',
        })
      }
    }
    if (value.attendanceType === 'ABSENT' && blank(value.note)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['note'],
        message: '결석 사유를 입력하세요',
      })
    }
    if (value.officialLeaveUsed && !value.officialLeaveType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['officialLeaveType'],
        message: '공가 유형을 선택하세요',
      })
    }
    if (
      value.officialLeaveUsed &&
      value.officialLeaveType === 'OTHER' &&
      blank(value.officialLeaveOtherReason)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['officialLeaveOtherReason'],
        message: '기타 사유를 입력하세요',
      })
    }
  })

export type AttendanceFormValues = z.infer<typeof attendanceFormSchema>

// 기본값 — 지각 선택(시안 기본 상태), 공가 미사용.
export const ATTENDANCE_FORM_DEFAULTS: AttendanceFormValues = {
  attendanceType: 'LATE',
  expectedArrivalTime: '',
  expectedLeaveTime: '',
  outingStartTime: '',
  outingEndTime: '',
  officialLeaveUsed: false,
  officialLeaveType: null,
  officialLeaveOtherReason: '',
  note: '',
}
