// 학습 기록 검토(운영) 도메인 타입 — 1차 검토 큐(/admin/records/review).
// 블로그·스터디·자격증 제출을 MANAGER 단독으로 승인·반려·보완 요청.
// (BE 계약 확정 시 페어가 shared PR로 갱신)

export type RecordCategory = 'blog' | 'study' | 'certificate'

// 큐 노출 상태 — 대기·보완 요청 중심(승인·반려는 처리 후 큐에서 빠짐).
export type RecordReviewStatus = 'pending' | 'changes_requested'

// 인라인 결정 액션 — 미리보기 패널 푸터.
export type RecordDecision = 'approve' | 'reject' | 'changes'

// 강사 관찰 코멘트 — 조회 전용(강사 §13 화면은 조회 전용, 코멘트는 참고용 표시).
export interface InstructorNote {
  instructor: string // "김지훈 강사"
  at: string // "05-19 10:14"
  body: string
}

// 첨부 — RecordAttachment 표시용.
export interface RecordAttachmentRef {
  name: string // "airflow-trace-flow.png"
  meta: string // "PNG · 480 KB"
}

// 큐 행 + 미리보기 공용. category별로 미리보기 본문이 적응한다.
export interface RecordReviewItem {
  id: string
  student: { name: string; cohort: string } // cohort = "22기"
  category: RecordCategory
  title: string
  summary: string // 제목 아래 한 줄 요약
  externalUrl?: string // 블로그 등 외부 URL(있을 때만)
  body: string[] // 본문 단락(문제/해결·활동 내용·정책 확인 등)
  submittedAt: string // "2026-05-19 09:42"
  status: RecordReviewStatus
  noteCount: number // 제목 옆 강사 코멘트 수 배지
  instructorNote?: InstructorNote // 강사 관찰 코멘트(조회 전용)
  attachments: RecordAttachmentRef[]
  mileageCandidate?: string // "지급 후보 +15,000" 등(자격증·일부 카테고리)
}

// 검토 큐 요약 + 행 목록. (Figma "운영 — 학습 기록 검토 큐" 1507:10816)
export interface RecordReviewQueue {
  cohort: string // "AI 캠프 22기"
  instructor: string // 담당 강사 "김지훈"
  pendingTotal: number // 처리 대기 28
  weekProcessed: number // 이번 주 처리 94
  avgHours: number // 평균 처리 6.4(시간)
  unassigned: number // 미배정 6
  over24h: number // 24h 초과 3
  changesRequested: number // 보완 요청 중 12
  approvedToday: number // 오늘 승인 18
  payoutCandidates: number // 지급 후보 8
  rejectedThisWeek: number // 이번 주 반려 5
  byCategory: Record<RecordCategory, number> // 블로그 14·스터디 8·자격증 6
  items: RecordReviewItem[]
}
