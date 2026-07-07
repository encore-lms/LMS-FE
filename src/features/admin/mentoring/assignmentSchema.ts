import { z } from 'zod'

// 배정 생성 폼 — 반→팀→멘토 선택 + N시간(§29).
// 템플릿 선택은 활성 템플릿이 있을 때만 각 폼에서 추가 선차단한다.
// 같은 반 중복(409 MENTOR_ASSIGNMENT_DUPLICATED_COHORT)은 서버 검증 — 응답 코드로 안내.
// N시간 상한·소수 입력 단위(NUMERIC(6,2))는 문서 미확정 TODO — 양수만 검증한다.
export const assignmentSchema = z.object({
  cohortId: z.string().min(1, '반을 선택해주세요'),
  teamId: z.string().min(1, '팀을 선택해주세요'),
  mentorId: z.string().min(1, '멘토를 선택해주세요'),
  allocatedHours: z.coerce
    .number({ invalid_type_error: '배정 N시간을 숫자로 입력해주세요' })
    .positive('배정 N시간은 0보다 커야 합니다'),
  logTemplateId: z.string().optional(),
})

export type AssignmentInput = z.infer<typeof assignmentSchema>
