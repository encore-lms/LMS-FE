import { z } from 'zod'

// 조정 제안·확정 정보 변경 폼 — 일정 + 예상 시간 + 장소 필수
// (422 MENTOR_RESERVATION_REQUIRED_FIELD_MISSING 선차단), 멘토 메모는 선택.
// '새 일정'은 디자인상 자유 텍스트 — BE 확정 시 날짜·시간 피커 + ISO 정규화 TODO.
export const proposalSchema = z.object({
  dateTimeLabel: z.string().trim().min(1, '새 일정을 입력해주세요'),
  placeType: z.enum(['offline', 'online', 'etc']),
  expectedMinutes: z.coerce
    .number({ invalid_type_error: '예상 시간을 분 단위 숫자로 입력해주세요' })
    .int('예상 시간을 분 단위 숫자로 입력해주세요')
    .positive('예상 시간을 분 단위 숫자로 입력해주세요'),
  placeDetail: z.string().trim().min(1, '상세 장소를 입력해주세요'),
  mentorResponseNote: z.string().trim().optional(),
})

export type ProposalInput = z.infer<typeof proposalSchema>
