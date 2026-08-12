import { z } from 'zod'
import { isImageField, isTextField } from '../types'
import type { MentoringLogFieldSnapshot } from '../types'
import { minutesBetween } from './logMeta'

// 일지 작성/수정 폼 — RHF + Zod. 필수: 대상 팀·진행 일시(분 단위 시작→종료)·장소 유형+상세
// 장소·참석 멘티·템플릿 스냅샷 필수 항목 답변(422 MENTOR_LOG_REQUIRED_FIELD_MISSING 선차단).
// 템플릿 항목은 팀별 스냅샷으로 동적이라 getter 로 주입(superRefine 시점의 최신 항목 검증).
// 초안 저장은 자유 입력(스키마 미적용 — DRAFT 는 부분 입력 허용·인정 시간 미반영).

/** 오늘(KST) — 서버도 같은 기준으로 막는다. */
export function todayYmd() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(),
  )
}

export function buildLogFormSchema(
  getFields: () => MentoringLogFieldSnapshot[],
) {
  return z
    .object({
      teamId: z.string().min(1, '대상 팀을 선택해주세요'),
      // 일지는 이미 한 멘토링의 기록이다 — 앞날로 쓰면 인정 시간이 먼저 잡힌다(2026-08-06 QA).
      sessionDate: z
        .string()
        .min(1, '진행 일자를 입력해주세요')
        .refine((v) => !v || v <= todayYmd(), '아직 오지 않은 날짜로는 쓸 수 없어요'),
      startTime: z.string().min(1, '시작 시각을 입력해주세요'),
      endTime: z.string().min(1, '종료 시각을 입력해주세요'),
      placeType: z.enum(['offline', 'online', 'etc']),
      placeDetail: z.string().trim().min(1, '상세 장소를 입력해주세요'),
      attendedIds: z
        .array(z.string())
        .min(1, '참석 멘티를 1명 이상 선택해주세요'),
      answers: z.record(z.string(), z.string()),
    })
    .superRefine((v, ctx) => {
      // 실제 진행 시간 = 시작→종료 자동 산정(시간 차감 기준) — 0 이하 차단
      if (
        v.startTime &&
        v.endTime &&
        minutesBetween(v.startTime, v.endTime) <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endTime'],
          message: '종료 시각은 시작 시각 이후여야 해요 (실제 진행 시간 > 0)',
        })
      }
      for (const field of getFields()) {
        const value = (v.answers[field.fieldSnapshotId] ?? '').trim()
        if (field.required && !value) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['answers', field.fieldSnapshotId],
            // 이미지 항목의 값은 업로드한 id 라 '작성'이 아니라 '첨부'다.
            message: isImageField(field.type)
              ? `필수 항목이에요 — ${field.name} 이미지를 첨부해주세요`
              : `필수 항목이에요 — ${field.name}을(를) 작성해주세요`,
          })
        }
        // 글자수 한도는 텍스트 항목에만 — 이미지 값은 id 목록이라 길이를 재지 않는다.
        if (
          isTextField(field.type) &&
          field.charLimit != null &&
          value.length > field.charLimit
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['answers', field.fieldSnapshotId],
            message: `${field.charLimit}자 이내로 작성해주세요`,
          })
        }
      }
    })
}

export type LogFormInput = z.infer<ReturnType<typeof buildLogFormSchema>>
