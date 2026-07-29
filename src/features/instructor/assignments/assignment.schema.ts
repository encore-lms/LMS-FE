import { z } from 'zod'

// 과제·실습 생성/수정 폼 검증 — 기수·제목·마감일시 필수, 설명 최대 5,000자.
// 첨부 자료(URL·파일)는 폼 밖 상태로 관리 — URL 최대 5개·파일당 20MB·최대 5개 제한은 페이지에서.
export const assignmentSchema = z.object({
  cohortId: z.string().min(1, '기수를 선택해주세요'),
  title: z.string().trim().min(1, '과제 제목을 입력해주세요'),
  dueAt: z.string().trim().min(1, '마감일시를 입력해주세요'),
  description: z
    .string()
    .trim()
    .max(5000, '과제 설명은 최대 5,000자까지 입력합니다')
    .optional(),
})

export type AssignmentInput = z.infer<typeof assignmentSchema>
