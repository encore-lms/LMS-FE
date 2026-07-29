// 수강생 QnA 게시판 도메인 계약 — 기능 로컬(공유 파일 미오염).
// NOTE(정책): 기수 게시판은 2026-05-21 폐기 결정됨. 본 기능은 FE 선반영(prototyping)으로,
// DOCS/Figma/BE 정합 없이 트러블슈팅 패턴을 차용해 화면을 살린다. 정식화 시 재합의 필요.

import type { Tone } from '@/shared/lib/tone'
export type { Tone }

// 질문 상태 — 답변 대기 / 답변 있음 / 해결됨(채택 완료)
export type QnaStatus = 'open' | 'answered' | 'resolved'

/** 카테고리 카탈로그(정적) — 작성 폼·필터 칩 공용 */
export const QNA_CATEGORIES: { key: string; label: string; tone: Tone }[] = [
  { key: 'lecture', label: '강의', tone: 'brand' },
  { key: 'assignment', label: '과제', tone: 'info' },
  { key: 'env', label: '환경설정', tone: 'accent' },
  { key: 'career', label: '진로', tone: 'success' },
  { key: 'etc', label: '기타', tone: 'warning' },
]

/** 목록 통계 카드 */
export interface QnaStat {
  key: string
  label: string
  value: string
  unit: string
  sub: string
  tone: Tone
  barPct?: number
}

/** 필터 칩(카테고리 · 상태) */
export interface QnaFilter {
  key: string
  label: string
  count: number
  tone?: Tone
}

/** 목록 질문 카드 */
export interface QnaQuestion {
  id: string
  title: string
  excerpt: string // 본문 미리보기(목록 카드용)
  category: string
  categoryKey: string
  categoryTone: Tone
  status: QnaStatus
  statusLabel: string
  authorName: string
  createdAt: string // "2026-06-20"
  answerCount: number
  viewCount: number
  tags: string[]
}

export interface QnaListData {
  stats: QnaStat[]
  filters: QnaFilter[] // 카테고리 칩
  statusFilters: QnaFilter[] // 우측 상태 칩(해결됨·답변 있음·답변 대기)
  questions: QnaQuestion[]
}

/** 답변 아래 댓글(2단계 스레드 — 답변=1단, 댓글=1단 들여쓰기). 더 깊은 대화는 @멘션으로. */
export interface QnaComment {
  id: string
  answerId: string
  content: string
  authorName: string
  authorRole: string
  createdAt: string
  mentions: string[] // 본문에서 @지명된 이름들(알림·강조용)
  canDelete: boolean // 요청자가 작성자면 true → 삭제 버튼 노출
}

/** 답변 */
export interface QnaAnswer {
  id: string
  questionId: string
  content: string
  authorName: string
  authorRole: string // "수강생" | "멘토" | "강사"
  isAccepted: boolean // 질문자 채택 답변
  createdAt: string
  mentions: string[] // 본문에서 @지명된 이름들(알림·강조용) — 댓글과 같은 계약
  comments: QnaComment[] // 답변 스레드
  canDelete: boolean // 요청자가 작성자면 true
}

/** 새 댓글 작성 페이로드 */
export interface NewCommentInput {
  content: string
  mentions: string[]
}

/** 멘션 자동완성 후보 */
export interface QnaParticipant {
  name: string
  role: string
}

// 멘션 자동완성 후보 — 기수 동료·멘토·강사 mock 로스터(전역 명단 부재로 기능 로컬 정의).
// 정적 카탈로그라 types에 둔다(앱 번들이 mocks.ts/msw를 끌어오지 않도록).
export const QNA_MOCK_PARTICIPANTS: QnaParticipant[] = [
  { name: '이멘토', role: '멘토' },
  { name: '정강사', role: '강사' },
  { name: '김수강', role: '수강생' },
  { name: '박수강', role: '수강생' },
  { name: '최수강', role: '수강생' },
  { name: '한수강', role: '수강생' },
  { name: '오수강', role: '수강생' },
  { name: '나', role: '수강생' },
]

/** 상세 — 질문 본문 + 답변 스레드 */
export interface QnaDetail {
  id: string
  title: string
  content: string
  category: string
  categoryTone: Tone
  status: QnaStatus
  statusLabel: string
  authorName: string
  createdAt: string
  viewCount: number
  tags: string[]
  answers: QnaAnswer[]
  canDelete: boolean // 요청자가 질문 작성자면 true
}

/** 새 질문 작성 페이로드 */
export interface NewQuestionInput {
  title: string
  content: string
  categoryKey: string
  tags: string[]
}
