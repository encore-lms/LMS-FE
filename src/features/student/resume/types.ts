import type { ResumeFeedbackItem } from '@/shared/types'
// 수강생 이력서 도메인 계약 — 기능 로컬(공유 파일 미오염). BE 합류 시 페어가 정합.
// 상태·섹션명은 한글 문자열 그대로 값으로 사용(팀 결정 B안). 섹션 목록은 ./constants 의 SECTIONS.

/** 이력서 상태 — 사용자 제출 여부 */
export type ResumeStatus = '작성 중' | '작성 완료'

/** 목록 카드용 요약 */
export interface ResumeSummary {
  id: string
  title: string
  status: ResumeStatus
  doneSections: string[] // 작성 완료된 섹션명(SECTIONS 부분집합) — 카드 진행률·칩
  updatedAt: string // 최종 수정 (ISO 8601)
}

/** 경력·학력·자격·수상·교육경험·기타활동·프로젝트 공통 항목 */
export interface ResumeItem {
  title: string // 회사/학교/자격증/프로젝트명 등
  subtitle: string // 역할/학위/발급처 등 (없으면 '')
  period: string // 기간 (없으면 '')
  description: string // 설명 (없으면 '')
}

/** 기본정보 */
export interface ResumeBasicInfo {
  name: string
  phone: string
  email: string
  birth: string
  githubUrl: string
  blogUrl: string
}

/** 자기소개서 블록 */
export interface ResumeCoverLetter {
  question: string
  content: string
}

/** 이력서 전체 — 편집기용 */
export interface ResumeDetail {
  id: string
  title: string
  status: ResumeStatus
  basicInfo: ResumeBasicInfo
  strength: string // 핵심역량/강점
  educations: ResumeItem[]
  careers: ResumeItem[]
  certificates: ResumeItem[]
  awards: ResumeItem[]
  trainings: ResumeItem[]
  activities: ResumeItem[]
  skills: string[] // 기술스택
  projects: ResumeItem[]
  coverLetters: ResumeCoverLetter[]
  // 파생(서버 계산, 읽기 전용)
  doneSections: string[]
  updatedAt: string
  /** 강사·운영이 남긴 피드백 — 수강생은 읽기 전용. */
  feedbacks?: ResumeFeedbackItem[]
}

/** 목록 응답 — 이력서 + KPI(누적 피드백) */
export interface ResumeListResponse {
  resumes: ResumeSummary[]
  feedbackCount: number
}

/** 생성 페이로드 */
export interface ResumeCreatePayload {
  title: string
}

/** 수정 페이로드 — 편집 가능 필드만(id·파생필드 제외) */
export type ResumeUpdatePayload = Omit<
  ResumeDetail,
  'id' | 'doneSections' | 'updatedAt'
>
