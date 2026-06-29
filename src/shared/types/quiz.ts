// 퀴즈 도메인 계약 — 공유 읽기전용. 변경은 도메인 PR에 섞지 말고 별도 "shared" PR로 페어 동기화.
// 근거: LMS-DOCS 30_설계/60_기능/quiz, 20_데이터. 수강생 3화면(목록/응시/결과) 모델 +
// 운영 퀴즈 계약(정답 관리·수동 채점 — 하단 admin 섹션). wire 포맷: 날짜는 ISO 8601 string.

import type { Role } from './user'

export type GradingMode = 'AUTO' | 'MANUAL' | 'MIXED'
export type QuestionType =
  | 'multiple_choice'
  | 'short_answer'
  | 'fill_blank'
  | 'essay'
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
  difficulty?: 'easy' | 'normal' | 'hard' // 난이도 — 응시 화면 배지(QuestionDifficulty와 동일 값)
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
  pending?: boolean // 수동 채점 대기(서술 등) — 점수 미확정
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

// ── 운영 퀴즈: 정답 관리 (/admin/quizzes/:quizId/answers — Figma 1515:10493) ──
// 정책: 독립 재채점 버튼 없음 — 정답/배점 변경 저장 시 자동 재채점 트리거.
// 변경 사유 미입력 시 저장 불가(P0-ADM-QUIZ-006, 감사 로그 필수).

/** 테이블 행 상태 — '정상' | '확인 필요' | '검토' | '비활성 후보' */
export type QuizAnswerRowStatus =
  | 'normal'
  | 'needs_check'
  | 'review'
  | 'deactivate_candidate'

/** 정답 관리 문항 행 */
export interface QuizAnswerRow {
  questionId: string
  questionNo: number // 문항 번호 1·3·5·8·10
  type: QuestionType // 디자인 노출은 객관식·단답형 2종
  summary: string // 문제 요약
  currentAnswerKey: string // 현재 정답 — 'B' / 'JOIN' / 'GROUP BY'
  maxPoints: number // 배점
  /** 변경안 — null = 변경 없음. 문항 비활성(셀 표기 '삭제')은 status='deactivate_candidate'로 표현 */
  proposedAnswerKey: string | null
  affectedCount: number // 영향 제출 인원(0 = '없음')
  status: QuizAnswerRowStatus
}

/** 정답 관리 응답 — GET /api/admin/quizzes/:quizId/answers */
export interface QuizAnswersData {
  quizTitle: string
  kpi: {
    totalQuestions: number // 대상 문제 10
    multipleChoiceCount: number // 객관식 8
    shortAnswerCount: number // 단답형 2
    changeCandidates: number // 변경 후보 3(정답/배점 수정)
    affectedSubmissions: number // 영향 제출 31(기존 결과 재계산)
    payoutCandidates: number // 지급 후보 12(점수 기준 영향)
  }
  rows: QuizAnswerRow[]
}

/** 저장 전 영향 계산 — GET /api/admin/quizzes/:quizId/answers/impact 응답 */
export interface QuizAnswerImpact {
  affectedSubmissionCount: number // 영향 제출 수 — 12명
  scoreChangeSummary: string // 점수 변경 예상 — '문항 3 정답 A → C 변경 시 12명 점수가 변동됩니다.'
  inProgressAttemptExcluded: number // 진행 중 attempt 제외 수 — 재채점 대상에서 빠짐, summary에 표시
  payoutCandidateCount: number // 지급 후보 수
  affectedAreas: string[] // 영향 범위 — '학생 결과 화면 점수/피드백' 등 4종
}

/** 변경 항목 — reason 미입력 시 저장 불가(FE 선차단 + 감사 로그 기록) */
export interface QuizAnswerChangeItem {
  questionId: string
  afterAnswerKey: string
  maxPoints: number
  reason: string // 변경 사유 — 감사 로그에 자동 기록
}

/** 변경 저장 DTO — POST /api/admin/quizzes/:quizId/answers/changes */
export interface QuizAnswerChangeRequest {
  changes: QuizAnswerChangeItem[]
}

/** 정답 변경 감사 로그 — 저장 시 자동 기록(KPI '감사 로그 필수') */
export interface QuizAnswerChangeLog {
  id: string
  questionId: string
  beforeAnswerKey: string
  afterAnswerKey: string
  changedBy: string // '김운영'
  changedByRole: Role // 'MANAGER' 등
  reGradedSubmissionCount: number // 재채점된 제출 수
  inProgressAttemptCount: number // 재채점에서 제외된 진행 중 attempt 수
  reason: string // 변경 사유
  changedAt: string // ISO 8601
}

// ── 운영 퀴즈: 수동 채점 (/admin/quizzes/:quizId/submissions/:submissionId/grade — Figma 1515:10710) ──
// admin 전용 계약 — 강사 GradingDetail(instructorQuiz.ts)과 별개 모델(운영 작업은 instructor 의존 금지).
// GET/PATCH /api/admin/quizzes/:quizId/submissions/:submissionId/grade.

/** 수동 채점 문항 유형 — 'essay'(서술형)는 수동 채점 전용(강사 InstructorQuestionType과 동일 값) */
export type AdminGradingQuestionType = QuestionType | 'essay'

/** 수동 채점 문항 카드 */
export interface AdminGradingItem {
  questionId: string
  questionNo: number // 문항 5 · 문항 8
  type: AdminGradingQuestionType
  maxPoints: number // 배점 12 · 20
  prompt: string // 문제
  studentAnswer: string // 학생 답안
  rubric?: string // 채점 기준 — 있는 문항만('GROUP BY 포함, …')
  score: number | null // 획득 점수 — null = 미입력. FE에서 0~maxPoints 클램프
  feedback: string // 피드백(빈 문자열 = 미입력)
  feedbackVisible: boolean // 피드백 공개 여부
  /** 채점 상태 pill — Figma는 '부분 정답'(partial)만 표현, 값 확장은 BE 확정 대기 */
  resultStatus?: 'correct' | 'partial' | 'incorrect'
}

/** 운영 수동 채점 상세 — KPI 5종 + 제출 요약 + 문항 카드(수동 채점 대상만) */
export interface AdminGradingDetail {
  submissionId: string
  quizId: string
  student: { name: string; cohort: string } // '박서연' · 'DA 4기'
  quizTitle: string // 'SQL 조인 퀴즈'
  submittedAt: string // '2026-05-19 09:34'
  gradingStatus: GradingStatus // KPI '피드백 공개'(대기→공개)는 finalized 여부로 파생
  currentScore: number // 현재 점수 68 — 자동 채점 + 입력된 수동 점수 합(임시 저장 포함)
  ungradedCount: number // 미채점 문항 2(주관식 2개)
  changeLogCount: number // 변경 이력 수 3(자동 저장 포함)
  elapsedMinutes: number // 채점 소요 시간 12(m)
  avgElapsedMinutes: number // 평균 소요 8(m)
  timeLimitMinutes: number // 제한 시간 40분
  timeUsedMinutes: number // 38분 사용
  autoGradedCount: number // 자동 채점 진행 6
  totalQuestionCount: number // 전체 8 문항
  /** 이전/다음 학생 — 제출 현황 순서 기준, null = 끝단(버튼 disabled) */
  prevSubmissionId: string | null
  nextSubmissionId: string | null
  items: AdminGradingItem[] // 수동 채점 대상 문항만
}
