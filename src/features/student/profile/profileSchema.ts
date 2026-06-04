import { z } from 'zod'

// 마이 프로필 편집 폼 스키마 — 표시명(필수 2~30) · GitHub/블로그 URL(필수) · 포트폴리오/LinkedIn(선택).
const requiredUrl = z
  .string()
  .min(1, '필수 항목입니다')
  .url('올바른 URL 형식이 아닙니다')
const optionalUrl = z
  .string()
  .url('올바른 URL 형식이 아닙니다')
  .or(z.literal(''))

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, '표시명은 2자 이상이어야 합니다')
    .max(30, '표시명은 30자 이하여야 합니다'),
  githubUrl: requiredUrl,
  blogUrl: requiredUrl,
  portfolioUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  publicSettings: z.object({
    profileImage: z.boolean(),
    githubUrl: z.boolean(),
    blogUrl: z.boolean(),
    portfolioUrl: z.boolean(),
    linkedinUrl: z.boolean(),
  }),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
