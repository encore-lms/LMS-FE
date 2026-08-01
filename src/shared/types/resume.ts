// 이력서(Resume, learning-service /resumes) 도메인 타입 — 정본 §32 lean.
// 운영(admin/education)·강사(instructor/education)·수강생(student/resume) 3역할이 함께 쓰는
// 교차 계약이라 shared 로 승격(2026-08-01, 구 위치: features/admin/education/types.ts).

export type ResumeStatusCode = 'DRAFT' | 'COMPLETED'

export interface ResumeRow {
  id: string
  studentUserId: string
  title: string
  status: ResumeStatusCode
  feedbackCount: number
  updatedAt: string
}

export interface ResumeFeedbackItem {
  id: string
  authorUserId: string
  /** BE가 auth에서 해석한 작성자 실명 — 조회 실패 시 null */
  authorName: string | null
  body: string
  createdAt: string
}

export interface ResumeDetail {
  id: string
  studentUserId: string
  title: string
  status: ResumeStatusCode
  content: string | null
  createdAt: string
  updatedAt: string
  feedbacks: ResumeFeedbackItem[]
}
