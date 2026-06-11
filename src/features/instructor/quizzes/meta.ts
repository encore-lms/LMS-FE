import type { BadgeTone } from '@/components/ui/StatusBadge'
import type { GradingMode } from '@/shared/types'
import type { QuizVisibility, InstructorQuestionType } from '@/shared/types'

// 강사 퀴즈 화면 공용 표기 — 채점 모드/공개 상태/문항 유형 pill. (Figma §5~§9)
export const GRADING_MODE_META: Record<
  GradingMode,
  { label: string; tone: BadgeTone; description: string }
> = {
  AUTO: {
    label: 'AUTO',
    tone: 'success',
    description: '객관식·OX·단답형(정답 매칭) — 시스템 자동 채점',
  },
  MANUAL: {
    label: 'MANUAL',
    tone: 'warning',
    description: '서술형·코드 작성 — 강사 수동 채점',
  },
  MIXED: {
    label: 'MIXED',
    tone: 'accent',
    description: '문제별 채점 방식 혼합 — 자동+수동 병행',
  },
}

export const VISIBILITY_META: Record<
  QuizVisibility,
  { label: string; tone: BadgeTone; description: string }
> = {
  draft: {
    label: '임시저장',
    tone: 'neutral',
    description: '문제 작성 중 · 학생에게 노출되지 않음',
  },
  published: {
    label: '공개',
    tone: 'success',
    description: '학생에게 노출 · 기간 도래 시 응시 가능',
  },
  closed: {
    label: '종료',
    tone: 'neutral',
    description: '응시 종료 · 결과만 조회 가능',
  },
}

export const QUESTION_TYPE_LABEL: Record<InstructorQuestionType, string> = {
  multiple_choice: '객관식',
  short_answer: '단답형',
  fill_blank: '빈칸',
  essay: '주관식',
}

export const DIFFICULTY_LABEL = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
} as const
