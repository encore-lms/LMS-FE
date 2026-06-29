// 강사 퀴즈 Main Flow (/instructor/quizzes*) — 목록·생성/수정·문제 관리·제출 현황·수동 채점.
// 공유 읽기전용 계약. 수강생 응시 계약(quiz.ts)과 분리 — GradingMode만 공유.
import type { GradingMode } from './quiz'

// ── §5 퀴즈 관리 목록 (Figma 1337:9753) ──
export type QuizVisibility = 'draft' | 'published' | 'closed' // 임시저장 / 공개 / 종료

export interface InstructorQuizRow {
  id: string
  title: string
  cohortLabel: string // 'DA 4기'
  subject: string // '알고리즘'
  gradingMode: GradingMode
  startAt: string // 'YYYY-MM-DD'
  endAt: string
  submitted: number
  targetCount: number
  /** 수동 채점 대기 건수 — 0이면 채점 완료, null이면 채점 이력 없음(임시저장) */
  manualPending: number | null
  visibility: QuizVisibility
}

export interface InstructorQuizListData {
  total: number
  manualPendingTotal: number
  items: InstructorQuizRow[]
}

// ── §6 퀴즈 생성/수정 (Figma 1338:9792) ──
export type ResultRevealPolicy = 'after_grading' | 'immediate' | 'after_close'

export interface QuizFormDetail {
  id: string
  /** 실 기수 ID — 폼 선택값(생성/수정 payload). */
  cohortId: string
  title: string
  cohortOption: string // 기수 라벨
  description: string
  startAt: string // 'YYYY-MM-DD HH:mm'
  endAt: string
  timeLimitMin: number
  allowRetake: boolean
  gradingMode: GradingMode
  resultReveal: ResultRevealPolicy
  shuffleQuestions: boolean
  shuffleChoices: boolean
  totalPoints: number
  questionCount: number
  /** 이미 제출 존재 — amber 경고 + 채점 모드 변경 차단 */
  submittedCount: number
  visibility: QuizVisibility
}

// ── §7 문제 관리 (Figma 1341:9831) ──
export type InstructorQuestionType =
  | 'multiple_choice'
  | 'short_answer'
  | 'fill_blank'
  | 'essay' // 주관식 — 수동 채점으로 자동 연결

export type QuestionDifficulty = 'easy' | 'normal' | 'hard'

export interface InstructorQuestion {
  id: string
  order: number
  type: InstructorQuestionType
  points: number
  /** 좌측 목록 요약 = 본문 첫 줄 */
  summary: string
  body: string
  modelAnswer: string // 모범 답안/채점 기준 — 학생 비공개
  explanation: string // 해설 — 결과 화면 노출
  category: string // QuizCategory 표기 '알고리즘 · DP'
  difficulty: QuestionDifficulty
  createdAt: string
  updatedAt: string
  respondedCount: number
  totalCount: number
  avgScore: number | null
  /** 객관식 보기(실 BE). 주관식·빈칸은 빈 배열 */
  choices?: string[]
  /** 정답 — 객관식: 보기 index, 주관식: 정답 텍스트, 빈칸: 정답 JSON */
  answerKey?: string
}

export interface QuizQuestionsData {
  quizTitle: string
  gradingMode: GradingMode
  totalPoints: number // 현재 합계
  targetPoints: number // 퀴즈 설정 총점
  questions: InstructorQuestion[]
}

// ── §8 제출 현황 (Figma 1343:9870) ──
export type SubmissionGradingState = 'manual_pending' | 'auto_done' | 'done'

export interface QuizSubmissionRow {
  id: string
  studentUserId: string
  studentName: string
  cohortLabel: string
  submitted: boolean
  submittedAt: string | null // '05-17 21:14'
  score: number | null
  scoreFinal: boolean // false = 임시 (수동 대기)
  gradingState: SubmissionGradingState | null // null = 미제출
  manualPendingCount: number // gradingState=manual_pending일 때 남은 문항 수
  feedbackEntered: boolean
}

export interface QuizSubmissionsData {
  quizTitle: string
  totalPoints: number
  kpi: {
    submitted: number
    targetCount: number
    notSubmitted: number
    manualPending: number
    avgScore: number
  }
  rows: QuizSubmissionRow[]
}

// ── §9 수동 채점 (Figma 1345:9909) ──
export type GradingItemStatus = 'done' | 'in_progress' | 'pending'

export interface GradingItem {
  questionId: string
  index: number // 문제 N
  type: InstructorQuestionType
  points: number
  status: GradingItemStatus
  body: string
  studentAnswer: string
  rubric: string // 채점 기준 (강사용)
  score: number | null
  feedback: string
  feedbackVisible: boolean
}

export interface GradingDetail {
  submissionId: string
  studentUserId: string
  studentName: string
  cohortLabel: string
  quizTitle: string
  submittedAt: string // '2026-05-17 21:14'
  totalScore: number // 퀴즈 총점
  provisionalScore: number // 자동 채점 + 입력된 수동 점수 합
  items: GradingItem[] // 수동 채점 대상 문항만
  totalManualCount: number
}

// ── §10 퀴즈 템플릿 (Figma 1354:9948 · 1392:10014 · 3547:2247) ──
export interface QuizTemplateRow {
  id: string
  name: string
  description: string // '4기 알고리즘 강의용 · 만점 100'
  isNew: boolean // NEW 배지
  category: string // '알고리즘'
  questionCount: number
  totalPoints: number
  lastUsedAt: string | null // null = 미사용
  useCount: number // 복제 횟수 — 0이면 삭제 가능
}

export interface QuizTemplateListData {
  total: number
  totalUseCount: number
  items: QuizTemplateRow[]
}

export interface QuizTemplateDetail {
  id: string
  name: string
  category: string
  description: string
  gradingMode: GradingMode
  resultReveal: ResultRevealPolicy
  shuffleQuestions: boolean
  shuffleChoices: boolean
  totalPoints: number
  questionCount: number
  /** 메타 기본값 — 복제 시 인스턴스로 전달 (0 = 무제한) */
  defaultTimeLimitMin: number
  createdAt: string
  lastUsedAt: string | null
  /** 파생 활성 퀴즈 수 — 0보다 크면 편집 시 소급 미반영 경고 */
  derivedActiveCount: number
}

export interface TemplateQuestionsData {
  templateName: string
  gradingMode: GradingMode
  totalPoints: number
  targetPoints: number
  useCount: number
  derivedActiveCount: number
  questions: InstructorQuestion[]
}
