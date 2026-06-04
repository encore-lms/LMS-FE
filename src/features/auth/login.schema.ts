import { z } from 'zod'

// 로그인 폼 검증 스키마 — RHF + zodResolver의 입력 계약.
//
// 폼 패턴 레퍼런스(이후 모든 폼이 이 관례를 따른다):
//   - 폼별 스키마는 화면 옆에 `<form>.schema.ts`로 둔다(검증 규칙 SSOT).
//   - schema(z.object) + `z.infer` 타입을 함께 export 한다.
//   - 화면에서 `useForm<LoginInput>({ resolver: zodResolver(loginSchema) })`로 연결.
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('이메일 형식이 아니에요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export type LoginInput = z.infer<typeof loginSchema>
