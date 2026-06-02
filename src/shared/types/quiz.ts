// 퀴즈 도메인 계약 — 공유 읽기전용. 변경은 도메인 PR에 섞지 말고 별도 "shared" PR로 페어 동기화.
// 근거: LMS-DOCS 30_설계/60_기능/quiz, 20_데이터. 수강생 3화면(목록/응시/결과)이 소비하는 모델만 정의
// (강사 전용 QuizAnswerChangeLog 등은 강사 PR에서 추가). wire 포맷: 날짜는 ISO 8601 string.

export type GradingMode = 'AUTO' | 'MANUAL' | 'MIXED'
export type QuestionType = 'multiple_choice' | 'short_answer' | 'fill_blank'
export type GradingType = 'AUTO' | 'MANUAL'
export type AttemptStatus =
  | 'in_progress'
  | 'submitted'
  | 'expired'
  | 'cancelled'
export type GradingStatus = 'auto_graded' | 'pending_manual' | 'finalized'

/** 문제 타입별 답안 페이로드 — draft/제출/채점에서 동일 구조 재사용 */
export type AnswerPayload =
  | { kind: 'multiple_choice'; selectedChoiceId: string }
  | { kind: 'short_answer'; text: string }
  | { kind: 'fill_blank'; answers: string[] }

/** 퀴즈 인스턴스 (목록·응시·결과 공통 헤더) */
export interface Quiz {
  id: string
  cohortId: string
  title: string
  description?: string
  gradingMode: GradingMode
  startsAt: string
  endsAt: string
  timeLimitMinutes: number
  maxAttempts: number
  shuffleQuestions: boolean
}

/** 선택지 — 응시 화면 객관식 렌더용 (정답 노출 금지: answerKey는 결과에서만) */
export interface QuizChoice {
  id: string
  label: string
}

/** 문제 — 응시 화면용(정답 미포함). 결과 화면은 QuizAnswer로 정오답을 받는다. */
export interface QuizQuestion {
  id: string
  quizId: string
  categoryId: string // Python/SQL/ML 등 기술 카테고리
  type: QuestionType
  gradingType: GradingType
  prompt: string
  maxPoints: number
  orderNo: number
  choices?: QuizChoice[] // 객관식만
}

/** 응시 세션 — 응시 화면 진입 시 생성/조회 */
export interface QuizAttempt {
  id: string
  quizId: string
  attemptNo: number
  status: AttemptStatus
  startedAt: string
  expiresAt: string // startedAt + timeLimitMinutes (남은 시간 = expiresAt - now)
  submittedAt?: string
}

/** 임시 저장 답안 (응시 화면) */
export interface QuizAnswerDraft {
  questionId: string
  payload: AnswerPayload
  savedAt: string
}

/** 최종 제출 (결과 화면 헤더/요약) */
export interface QuizSubmission {
  id: string
  quizId: string
  attemptNo: number
  submittedAt: string
  gradingStatus: GradingStatus
  totalScore: number // pending_manual이면 자동채점분까지의 현재 점수
  finalizedAt?: string
}

/** 채점 결과(문제 단위) — 결과 화면 본문 */
export interface QuizAnswer {
  questionId: string
  prompt: string
  categoryId: string
  maxPoints: number
  answer: AnswerPayload // 내가 낸 답
  correctAnswerKey?: string | string[] // 정답(공개 정책 시)
  earnedPoints: number
  isCorrect: boolean
  feedback?: string
}

// ── 화면별 뷰 모델(응답 합성형) ──

/** 목록 한 행 — Quiz + 내 제출/응시 요약을 합친 뷰 모델 (BE가 합성해 내려줌) */
export interface QuizListItem {
  quiz: Quiz
  myAttemptCount: number
  /** 탭 판정용 파생 상태 (BE 계산값; FE는 표시만) */
  state: 'available' | 'completed' | 'pending_manual' | 'closed'
  latestSubmission?: Pick<
    QuizSubmission,
    'id' | 'gradingStatus' | 'totalScore' | 'submittedAt'
  >
}

/** 결과 화면 응답 묶음 */
export interface QuizResult {
  submission: QuizSubmission
  answers: QuizAnswer[]
}
