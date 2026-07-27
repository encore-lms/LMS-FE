import { z } from 'zod'

// 배정 생성 폼 — 반→팀→멘토 선택 + N시간 + 일지 템플릿(§29).
// 일지 템플릿은 필수 — 템플릿 없이는 배정 불가(활성 템플릿이 없으면 먼저 생성해야 함).
// 같은 반 중복(409 MENTOR_ASSIGNMENT_DUPLICATED_COHORT)은 서버 검증 — 응답 코드로 안내.
// N시간 상한·소수 입력 단위(NUMERIC(6,2))는 문서 미확정 TODO — 양수만 검증한다.
export const assignmentSchema = z.object({
  cohortId: z.string().min(1, '반을 선택해주세요'),
  teamId: z.string().min(1, '팀을 선택해주세요'),
  mentorId: z.string().min(1, '멘토를 선택해주세요'),
  allocatedHours: z.coerce
    .number({ invalid_type_error: '배정 시간을 숫자로 입력해주세요' })
    .positive('배정 시간은 0보다 커야 합니다'),
  logTemplateId: z.string().min(1, '일지 템플릿을 선택해주세요'),
})

export type AssignmentInput = z.infer<typeof assignmentSchema>
