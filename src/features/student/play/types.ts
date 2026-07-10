// 수강생 PLAY 도메인 계약 — 기능 로컬(공유 파일 미오염). Figma 418:2172 외.
// 게임 선택 · 타자 게임 · 결과·예외 상태.

export type { Tone } from '@/shared/lib/tone'

export interface PlayStat {
  label: string
  value: string
  sub: string
}

export interface PlayGame {
  key: string
  name: string
  desc: string
  status: 'available' | 'soon' // 사용 가능 / 준비 중
  progress?: string // "이번 주 최고 612타 · 정확도 97.2%"
  progressPct?: number
}

export interface PlayRecord {
  when: string
  game: string
  detail: string // "612타 · 97.2%"
  score: string
}

export interface PlayRank {
  rank: number
  name: string
  score: string
  me: boolean
}

export interface PlayOverview {
  stats: PlayStat[]
  games: PlayGame[]
  records: PlayRecord[]
  ranking: PlayRank[]
}

/** 타자 게임 세션 */
export interface TypingPrompt {
  title: string
  meta: string // "고급 · 620자"
  text: string // 선택 시 입력 영역에 노출할 제시문 본문
}
export interface TypingSession {
  stats: PlayStat[]
  level: string // "중급 · 450자"
  text: string
  sessionId: string
  promptName: string
  basis: string
  reward: string
  durationSec: number // 세션 제한 시간(초) — 타이머 기준
  personalBest: number // 개인 최고 점수 — 결과 best 판정 기준
  otherPrompts: TypingPrompt[]
}
/** 타자 게임 결과 — 클라 계산 후 결과 페이지로 navigate state 전달. */
export interface TypingResult {
  sessionId: string
  promptName: string
  durationSec: number
  elapsedSec: number
  correctChars: number
  cpm: number // 분당 타수
  wpm: number
  accuracy: number // 0~100
  typos: number
  backspaces: number
  comboBonus: number
  score: number
  best: boolean
}

/* ── 코딩 테스트 (Figma 4911:6913 · 결과 4917:7092 · 언어 모달 4938:7353) ──── */
// 언어별 5문제. 빈칸 채우기·출력 예측·핵심 코드 작성이 섞여 출제되고 난이도별 배점이 다르다.
export type CodingFormat = 'fill-blank' | 'predict-output' | 'write-code'

export interface CodingProblem {
  id: string
  language: string // Java/Python/C
  format: CodingFormat
  title: string
  difficulty: '쉬움' | '보통' | '어려움'
  points: number // 난이도별 배점
  prompt: string // 문제 설명
  code?: string // 보여줄 코드(빈칸=____, 출력예측=실행 코드, 핵심코드=시그니처)
  // 채점(결정적): predict-output·fill-blank=정답 후보 중 하나와 일치, write-code=필수 토큰 모두 포함.
  accept: string[]
  solution: string // 공개용 정답
}
export interface CodingTest {
  testId: string
  durationSec: number // 전체 제한 시간(초) — 단일 타이머
  basis: string
  reward: string
  problems: CodingProblem[] // 언어별 5문제(전체 15)
}
/** 문제별 결과 — 결과 화면 리뷰의 원천. */
export interface CodingProblemResult {
  index: number // 1-based
  title: string
  format: CodingFormat
  difficulty: string
  points: number
  solved: boolean
  attempts: number
  solution: string // 정답(결과 화면에서 공개)
}
/** 클라 계산 결과 — 결과 페이지로 navigate state 전달. */
export interface CodingTestResult {
  testId: string
  language: string
  durationSec: number
  elapsedSec: number
  total: number
  solved: number
  attempts: number // 총 제출 횟수
  score: number
  results: CodingProblemResult[]
}

/* ── CS 퀴즈 배틀 (Figma 4911:7000 · 결과 4917:7179) ───────────────────── */
export interface QuizBattleQuestion {
  id: string
  category: string // "운영체제"
  difficulty: string // "보통"
  prompt: string
  options: string[] // 4지선다
  answerIndex: number // 정답 인덱스
  explanation: string
}
export interface QuizRival {
  name: string // "AI 페이서 Lv.3"
  accuracy: number // 0~1 — 문제별 정답 확률(페이스)
}
export interface QuizBattle {
  battleId: string
  category: string
  reward: string
  perQuestionSec: number // 문제당 제한 시간(초) — 10문제 × 30초 ≈ 5분
  rival: QuizRival
  questions: QuizBattleQuestion[]
}
/** 문제별 정오 리뷰 — 결과 화면 10칸 리뷰의 원천. */
export interface QuizAnswerReview {
  index: number // 1-based
  prompt: string
  picked: number | null // null = 시간 초과 미응답
  answerIndex: number
  correct: boolean
}
export interface QuizBattleResult {
  battleId: string
  category: string
  total: number
  correct: number
  maxCombo: number
  elapsedSec: number
  myScore: number
  rivalName: string
  rivalScore: number
  rivalCorrect: number
  win: boolean
  reviews: QuizAnswerReview[]
}
