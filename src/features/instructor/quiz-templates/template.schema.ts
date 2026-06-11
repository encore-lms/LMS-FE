import { z } from 'zod'

// 퀴즈 템플릿 생성/편집 폼(§10) — 응시 기간·대상 기수·공개 설정은
// 인스턴스(복제) 단계 결정이라 제외. 라디오·토글은 폼 밖 상태.
export const templateSchema = z.object({
  name: z.string().trim().min(1, '템플릿명을 입력해주세요'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  description: z.string().trim().optional(),
  totalPoints: z.coerce
    .number({ invalid_type_error: '총점을 숫자로 입력해주세요' })
    .int('총점은 정수로 입력해주세요')
    .min(1, '총점은 1점 이상이어야 해요'),
  defaultTimeLimitMin: z.coerce
    .number({
      invalid_type_error: '제한 시간 기본값을 분 단위 숫자로 입력해주세요',
    })
    .int('제한 시간 기본값은 분 단위 정수로 입력해주세요')
    .min(0, '제한 시간 기본값은 0(무제한) 이상이어야 해요'),
})

export type TemplateInput = z.infer<typeof templateSchema>
