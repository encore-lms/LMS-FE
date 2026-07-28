import type { InstructorQuestionType } from '@/shared/types'

// 유형별 정답 편집 공용 로직 — §7 퀴즈 문항(QuizQuestionEditor)과 §10 템플릿 문항(QuestionWorkbench)이 공유.
// 정답 상태(AnswerDraft) + 파생 계산 + 저장 페이로드 검증(buildAnswerPayload). 입력 UI는 AnswerFields.tsx.

export interface AnswerDraft {
  choices: string[]
  answerIndex: number
  answerText: string
  answers: string[]
  blankScores: number[]
}

export function emptyAnswer(): AnswerDraft {
  return {
    choices: ['', ''],
    answerIndex: 0,
    answerText: '',
    answers: [],
    blankScores: [],
  }
}

// fill_blank answerKey = {"answers":[...],"scores":[...]} (구버전 배열도 허용)
export function parseFillBlank(json?: string): {
  answers: string[]
  scores: number[]
} {
  if (!json) return { answers: [], scores: [] }
  try {
    const v = JSON.parse(json)
    if (Array.isArray(v)) return { answers: v.map(String), scores: [] }
    return {
      answers: (v.answers ?? []).map(String),
      scores: (v.scores ?? []).map(Number),
    }
  } catch {
    return { answers: [], scores: [] }
  }
}

// 저장된 문항(choices/answerKey) → 편집용 정답 상태.
export function parseAnswerDraft(
  type: InstructorQuestionType,
  choices?: string[],
  answerKey?: string,
): AnswerDraft {
  const fb = type === 'fill_blank' ? parseFillBlank(answerKey) : null
  return {
    choices: choices && choices.length >= 2 ? choices : ['', ''],
    answerIndex: type === 'multiple_choice' ? Number(answerKey ?? 0) || 0 : 0,
    answerText:
      type === 'short_answer' || type === 'essay' ? (answerKey ?? '') : '',
    answers: fb ? fb.answers : [],
    blankScores: fb ? fb.scores : [],
  }
}

// 문항 내용의 ___ 개수만큼 정답 칸 동기화.
export function countBlanks(text: string) {
  const m = text.match(/___/g)
  return m ? m.length : 0
}

// 배점 자동 분배(이전 LMS): 균등 + 나머지는 뒤 칸에 +1. (10,3)→[3,3,4]
export function distributeBlankScores(
  points: number,
  blanks: number,
): number[] {
  if (blanks <= 0) return []
  if (points < blanks) return Array.from({ length: blanks }, () => 1)
  const base = Math.floor(points / blanks)
  const rem = points - base * blanks
  return Array.from({ length: blanks }, (_, i) =>
    i >= blanks - rem ? base + 1 : base,
  )
}

// 빈칸 수에 맞춘 파생 배열 — 렌더와 저장 검증이 같은 값을 보게 한다.
export function deriveBlankAnswers(raw: string[], blanks: number): string[] {
  return Array.from({ length: blanks }, (_, i) => raw[i] ?? '')
}

export function deriveBlankScores(
  raw: number[],
  points: number,
  blanks: number,
): number[] {
  return raw.length === blanks ? raw : distributeBlankScores(points, blanks)
}

export interface AnswerPayloadFields {
  choices?: string[]
  answerIndex?: number
  answerText?: string
  answers?: string[]
  blankScores?: number[]
}

// 유형별 검증 + 저장 페이로드 필드. text = 빈칸(___)을 세는 원문(퀴즈 prompt·템플릿 body).
export function buildAnswerPayload(
  type: InstructorQuestionType,
  text: string,
  points: number,
  draft: AnswerDraft,
): { ok: true; fields: AnswerPayloadFields } | { ok: false; error: string } {
  if (type === 'multiple_choice') {
    const trimmed = draft.choices.map((c) => c.trim())
    const filtered = trimmed.filter((c) => c !== '')
    if (filtered.length < 2) {
      return { ok: false, error: '보기를 2개 이상 입력해 주세요' }
    }
    if (!trimmed[draft.answerIndex]) {
      return {
        ok: false,
        error: '정답으로 선택한 보기의 내용을 입력해 주세요',
      }
    }
    // 빈 보기가 걸러진 만큼 정답 index를 다시 센다(전송 목록 기준).
    const answerIndex = trimmed
      .slice(0, draft.answerIndex)
      .filter((c) => c !== '').length
    return { ok: true, fields: { choices: filtered, answerIndex } }
  }
  if (type === 'short_answer') {
    if (!draft.answerText.trim()) {
      return { ok: false, error: '정답을 입력해 주세요' }
    }
    return { ok: true, fields: { answerText: draft.answerText } }
  }
  if (type === 'essay') {
    // 서술형 — 수동 채점. 채점 기준(선택)만 보관.
    return { ok: true, fields: { answerText: draft.answerText } }
  }
  const blanks = countBlanks(text)
  if (blanks === 0) {
    return { ok: false, error: '문항 내용에 빈칸(___)을 넣어 주세요' }
  }
  const answers = deriveBlankAnswers(draft.answers, blanks)
  const emptyIdx = answers.findIndex((a) => a.trim() === '')
  if (emptyIdx >= 0) {
    return { ok: false, error: `빈칸 ${emptyIdx + 1} 정답을 입력해 주세요` }
  }
  const scores = deriveBlankScores(draft.blankScores, points, blanks)
  const scoreSum = scores.reduce((s, v) => s + (v || 0), 0)
  if (scoreSum !== points) {
    return {
      ok: false,
      error: `빈칸 배점 합(${scoreSum})이 배점(${points})과 달라요`,
    }
  }
  return { ok: true, fields: { answers, blankScores: scores } }
}

export const FIELD_BASE =
  'border-border focus:border-brand text-fg placeholder:text-fg-subtle rounded-lg border bg-white px-3 py-2 text-sm outline-none'
export const FIELD = `${FIELD_BASE} w-full`
