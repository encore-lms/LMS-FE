import { z } from 'zod'

// 새 HRD API Key 등록 폼 — 등록 후 키 원문은 다시 표시되지 않는다(§5 보안 규칙).
export const hrdKeySchema = z.object({
  name: z.string().trim().min(1, 'API 이름을 입력해주세요'),
  key: z
    .string()
    .trim()
    .min(1, 'API Key를 입력해주세요')
    .min(12, 'HRD-Net 발급 키 형식(12자 이상)을 확인해주세요'),
  description: z.string().trim().optional(),
})

export type HrdKeyInput = z.infer<typeof hrdKeySchema>
