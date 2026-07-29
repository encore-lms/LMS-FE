import { z } from 'zod'

// 퀴즈 생성/수정 폼(§6) — 텍스트·일시·숫자 입력만 스키마로 검증.
// 채점 모드/공개 설정 라디오 카드와 토글은 폼 밖 상태로 관리(기본값 보장이라 검증 불필요).
export const quizSchema = z
  .object({
    title: z.string().trim().min(1, '제목을 입력해주세요'),
    cohortId: z.string().min(1, '대상 과정/기수를 선택해주세요'),
    description: z.string().trim().optional(),
    // 분류 태그(예: 빅데이터) — 자유 입력, 선택. 목록 검색·필터의 단위가 된다.
    category: z.string().trim().max(50, '카테고리는 50자 이내로 입력해주세요').optional(),
    startAt: z.string().trim().min(1, '시작일을 입력해주세요'),
    endAt: z.string().trim().min(1, '종료일을 입력해주세요'),
    timeLimitMin: z.coerce
      .number({ invalid_type_error: '제한 시간을 분 단위 숫자로 입력해주세요' })
      .int('제한 시간은 분 단위 정수로 입력해주세요')
      .min(1, '제한 시간은 1분 이상이어야 해요'),
  })
  .refine((v) => v.startAt < v.endAt, {
    path: ['endAt'],
    message: '종료일은 시작일 이후여야 해요',
  })

export type QuizInput = z.infer<typeof quizSchema>
