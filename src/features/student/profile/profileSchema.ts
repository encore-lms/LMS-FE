import { z } from 'zod'
import { URL_FORMAT_MESSAGE, isHttpUrl } from '@/shared/lib/url'

// 마이 프로필 편집 폼 스키마 — 표시명(필수 2~30) · GitHub/블로그 URL(필수) · 포트폴리오/LinkedIn(선택).
// zod .url() 은 ftp:// 같은 스킴도 통과시켜 http(s) 규칙으로 직접 검사한다.
const requiredUrl = z
  .string()
  .min(1, '필수 항목입니다')
  .refine(isHttpUrl, URL_FORMAT_MESSAGE)
const optionalUrl = z
  .string()
  .refine((v) => v === '' || isHttpUrl(v), URL_FORMAT_MESSAGE)

export const profileSchema = z.object({
  // 프로필 이미지 — 업로드 시 data URL, 미설정이면 null(이니셜 아바타)
  profileImageUrl: z.string().nullable(),
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
  // 학습 다짐 — 온보딩 PLEDGE_MAX(300)와 같은 상한, 비워도 된다.
  promise: z.string().trim().max(300, '학습 다짐은 300자 이하여야 합니다'),
  publicSettings: z.object({
    profileImage: z.boolean(),
    githubUrl: z.boolean(),
    blogUrl: z.boolean(),
    portfolioUrl: z.boolean(),
    linkedinUrl: z.boolean(),
  }),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
