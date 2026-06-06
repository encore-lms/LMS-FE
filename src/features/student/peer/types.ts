// 수강생 동료 평가 도메인 계약 — 기능 로컬(공유 파일 미오염). Figma 401:1586 외.
// ⚠ Deprecated(2026-05-27): 프로젝트 워크스페이스 상호평가 탭으로 흡수. 보관용 화면.
// 동료 평가 허브 · PeerTag 부여 · PeerReputation 5축 평가.

export type Tone =
  | 'brand'
  | 'info'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'success'

export interface Badge {
  label: string
  tone: Tone
}
export interface PeerStat {
  key: string
  label: string
  value: string
  unit: string
  sub: string
  tone: Tone
}
export interface PeerAxis {
  key: string // 기술/책임감/소통/성장/팀워크
  desc: string
  score: number // 0~5
}

/** 허브 */
export interface PeerHubData {
  stats: PeerStat[]
  tagProgress: { done: number; total: number; remaining: number }
  repProgress: { done: number; total: number; remaining: number }
  receivedReputation: { key: string; score: number; sub: string }[]
}

/** 동료(부여 대상) */
export type PeerMemberStatus = 'editing' | 'done' | 'todo' // 작성 중 / 부여 완료 / 미부여
export interface PeerMember {
  id: string
  name: string
  role: string
  avatarTone: Tone
  status: PeerMemberStatus
  statusLabel: string
}

/** PeerTag 부여 */
export const PEER_TAGS: string[] = [
  '#분위기메이커',
  '#꼼꼼한기록',
  '#끝까지간다',
  '#문제기빨아내는해결사',
  '#빠른피드백',
  '#문서화장인',
  '#침착한디버거',
  '#페어신_깊은_리뷰어',
  '#주도하는리더',
  '#일정지킴이',
  '#질문잘하는',
]
export interface PeerTagData {
  progress: { done: number; total: number }
  members: PeerMember[]
  maxTags: number
}

/** PeerReputation 5축 평가 */
export interface PeerRepMember {
  id: string
  name: string
  role: string
  avatarTone: Tone
  meta: string // "같은 프로젝트 Encore Mart에서 협업"
  badges: Badge[]
  axes: PeerAxis[]
  recommend: string // "매우 추천"
  comment: string
}
export interface PeerRepData {
  progress: { done: number; total: number }
  target: PeerRepMember
  roster: { initial: string; tone: Tone; done: boolean }[]
}

export const RECOMMEND_OPTIONS = ['매우 추천', '추천', '보통', '비추천']
