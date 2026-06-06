// 수강생 PLAY 도메인 계약 — 기능 로컬(공유 파일 미오염). Figma 418:2172 외.
// 게임 선택 · 타자 게임 · 결과·예외 상태.

export type Tone =
  | 'brand'
  | 'info'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'success'

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
}
export interface TypingSession {
  stats: PlayStat[]
  level: string // "중급 · 450자"
  text: string
  sessionId: string
  promptName: string
  basis: string
  reward: string
  otherPrompts: TypingPrompt[]
}
