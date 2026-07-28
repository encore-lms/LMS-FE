import { z } from 'zod'

// 조정 제안·확정 정보 변경 폼 — 일정(날짜 + 시작/종료 시각) + 예상 시간 + 장소 필수
// (422 MENTOR_RESERVATION_REQUIRED_FIELD_MISSING 선차단), 멘토 메모는 선택.
// '새 일정'은 공용 DateTimePicker(날짜 1 + 시각 2)로 입력하고, 제출 시 표기 라벨
// 'M/D(요일) HH:mm ~ HH:mm' 로 합성한다(수강생 새 요청 폼 선례 동일). BE 확정 시
// confirmedStartsAt(ISO) + durationMinutes 정규화 TODO.
export const proposalSchema = z
  .object({
    date: z.string().trim().min(1, '날짜를 선택해주세요'),
    startTime: z.string().trim().min(1, '시작 시각을 선택해주세요'),
    endTime: z.string().trim().min(1, '종료 시각을 선택해주세요'),
    placeType: z.enum(['offline', 'online', 'etc']),
    expectedMinutes: z.coerce
      .number({ invalid_type_error: '예상 시간을 분 단위 숫자로 입력해주세요' })
      .int('예상 시간을 분 단위 숫자로 입력해주세요')
      .positive('예상 시간을 분 단위 숫자로 입력해주세요'),
    placeDetail: z.string().trim().min(1, '상세 장소를 입력해주세요'),
    mentorResponseNote: z.string().trim().optional(),
  })
  .refine((v) => !v.startTime || !v.endTime || v.endTime > v.startTime, {
    path: ['endTime'],
    message: '종료 시각은 시작 시각보다 늦어야 합니다',
  })

export type ProposalInput = z.infer<typeof proposalSchema>

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => String(n).padStart(2, '0')

/** 'H:mm' / 'HH:mm' → 'HH:mm'(피커 값 포맷). 매칭 실패는 빈 값. */
function normalizeTime(t: string): string {
  const m = /(\d{1,2}):(\d{2})/.exec(t)
  return m ? `${pad(Number(m[1]))}:${m[2]}` : ''
}

/**
 * 'HH:mm' 두 개의 분 차이 — 예상 시간 자동 계산용.
 * 형식이 어긋나거나 종료가 시작보다 이르면 0(호출부에서 자동 반영을 건너뛴다).
 */
export function minutesBetween(startTime: string, endTime: string): number {
  const s = normalizeTime(startTime ?? '')
  const e = normalizeTime(endTime ?? '')
  if (!s || !e) return 0
  const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  return Math.max(0, toMinutes(e) - toMinutes(s))
}

/**
 * 폼 분해값(날짜 'YYYY-MM-DD' + 시작/종료 'HH:mm') → 표기 라벨 'M/D(요일) HH:mm ~ HH:mm'.
 * 요일은 실제 날짜에서 계산(완료 예약 파생 deriveCompletedRequests 와 동일 규칙).
 */
export function composeScheduleLabel(input: {
  date: string
  startTime: string
  endTime: string
}): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date)
  if (!m) return `${input.date} ${input.startTime} ~ ${input.endTime}`.trim()
  const dow = WEEKDAYS[new Date(+m[1], +m[2] - 1, +m[3]).getDay()]
  return `${+m[2]}/${+m[3]}(${dow}) ${input.startTime} ~ ${input.endTime}`
}

/**
 * 기존 표기 라벨 → 폼 분해값(피커 프리필). 'M/D(요일) HH:mm ~ HH:mm' 와
 * 'YYYY-MM-DD HH:mm ~ HH:mm' 둘 다 지원. 연도 없는 멘토 시드 라벨은 올해로 보정(데모 mock —
 * BE ISO 확정 시 제거). 파싱 실패분은 빈 값으로 둬 재선택을 유도한다.
 */
export function parseScheduleLabel(label: string): {
  date: string
  startTime: string
  endTime: string
} {
  const times = label?.match(/\d{1,2}:\d{2}/g) ?? []
  const startTime = times[0] ? normalizeTime(times[0]) : ''
  const endTime = times[1] ? normalizeTime(times[1]) : ''
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(label ?? '')
  if (iso) return { date: `${iso[1]}-${iso[2]}-${iso[3]}`, startTime, endTime }
  const md = /(\d{1,2})\/(\d{1,2})/.exec(label ?? '')
  if (md) {
    const date = `${new Date().getFullYear()}-${pad(+md[1])}-${pad(+md[2])}`
    return { date, startTime, endTime }
  }
  return { date: '', startTime, endTime }
}
