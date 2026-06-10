import { z } from 'zod'

// 추천서 작성/수정 폼 — 긍정 추천서, 코멘트 길이 무제한(P0 31).
// 학생 선택은 폼 밖 상태로 관리(작성=picker, 수정=잠금)하므로 스키마에는 코멘트만.
export const endorsementSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, '추천 코멘트를 입력해주세요')
    .min(20, '구체적 사례를 포함해 20자 이상 작성해주세요'),
})

export type EndorsementInput = z.infer<typeof endorsementSchema>
