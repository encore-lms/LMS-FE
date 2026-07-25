// 과제/실습 도메인 계약 — 기능 로컬(공유 파일 미오염). BE 합류 시 페어가 정합.
// 목록(/student/course/assignments) + 상세·제출(/…/:id)이 소비하는 모델.

export type AssignmentStatus = 'not_submitted' | 'submitted' | 'reviewed'

/** 마감 표시 톤 — 임박(앰버)/일반/종료(회색) */
export type DueTone = 'soon' | 'normal' | 'ended'

/** 과제 목록 한 줄 */
export interface AssignmentListItem {
  id: string
  title: string
  subject: string // "백엔드 심화"
  status: AssignmentStatus
  dueLabel: string // "마감 D-2" | "마감 5/9 종료"
  dueTone: DueTone
  evaluationType: string // "피드백"
  hasFeedback?: boolean
}

/** 제출 초안(본문·URL·첨부) — 기존 제출이 있으면 프리필 */
export interface AssignmentDraft {
  body: string
  url: string
  assets: string[]
}

/** 과제 제출 요청 — POST /student/course/assignments/{assignmentId}/submission */
export type AssignmentSubmitInput = AssignmentDraft

/** 강사가 붙인 첨부 파일 참조(다운로드) */
export interface AssignmentFileRef {
  id: string
  name: string
  downloadUrl: string
}

/** 과제 상세·제출(/…/:id) */
export interface AssignmentDetail {
  id: string
  title: string
  description: string
  subject: string
  status: AssignmentStatus
  dueAtLabel: string // "2026-05-24 23:59"
  dueBadge: string // "D-2"
  dueTone: DueTone
  evaluationType: string
  draft: AssignmentDraft | null
  hasHistory: boolean
  submittedAtLabel?: string // 제출 완료 요약의 '제출 시각' (제출본 있을 때)
  /** 사이드 '검토 완료 예시'(있으면 노출) */
  feedbackExample?: {
    statusLabel: string // "검토 완료"
    evaluationType: string // "피드백"
    feedback: string
  }
  /** 강사 첨부 자료 — URL·파일 */
  urls?: string[]
  files?: AssignmentFileRef[]
}
