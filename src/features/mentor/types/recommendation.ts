// 멘토 도메인 타입 — 팀 추천 상태·후보·payload·제출 요약(M4).
import type { MentorTeamMember } from './team'
import type { EvaluationScoreTuple } from './evaluation'

/**
 * 추천 상태 — MentorRecommendationStatus 5종(P0_32_35 API명세).
 * 진입 조건: 팀원 전체 평가 최종 제출 완료(locked_until_evaluation).
 */
export type MentorRecommendationStatus =
  | 'locked_until_evaluation'
  | 'not_started'
  | 'draft'
  | 'submitted_recommended'
  | 'submitted_not_recommended'

/** 추천 모드 — 팀당 1명 추천 또는 '추천 안 함' 명시 선택(상호배타). */
export type MentorRecommendationMode = 'recommend' | 'none'

/** 추천 후보 카드 — 제출된 평가의 4축 점수·평균을 그대로 표시(조회 전용). */
export interface MentorRecommendationCandidate extends MentorTeamMember {
  /** 평가 평균(소수 1자리) — 평가 미제출이면 null */
  average: number | null
  scores: EvaluationScoreTuple
}

/**
 * 추천 초안·제출 payload — MentorRecommendationSubmitRequest(recommendationType) 대응.
 * notify 는 알림 발송 토글(BE 계약 'Notification optional' — FE 보존용, 확정 시 정합 TODO).
 */
export interface MentorRecommendationDraftPayload {
  mode: MentorRecommendationMode | null
  /** 추천 대상 — mode 'none'이면 null(targetStudentProfileId:null 대응) */
  studentId: string | null
  /** 증명서용 간략 요약 — 추천 시 필수(MENTOR_RECOMMENDATION_SUMMARY_REQUIRED), 최대 500자 */
  summary: string
  notify: boolean
}

/** GET /mentor/v1/teams/{teamId}/recommendation — 추천 선택 화면 단일 응답. */
export interface MentorRecommendationSheetData {
  teamId: string
  cohortLabel: string
  teamName: string
  memberCount: number
  status: MentorRecommendationStatus
  /** 팀 평가 평균(멤버 평균의 평균, 소수 1자리) — 평가 미제출이면 null */
  teamAverage: number | null
  candidates: MentorRecommendationCandidate[]
  /** 저장된 초안(없으면 기본값) — 제출 후에는 제출본 미러 */
  draft: MentorRecommendationDraftPayload
  submittedAtLabel: string | null
  /** 계약 종료 마감 — 경과 시 제출·재제출 잠금(읽기 전용) */
  submissionClosed: boolean
  /** 마감 라벨 '2026-12-28 까지' — 마감 없으면 null */
  submissionDeadlineLabel: string | null
}

/** 제출 완료 페이지 요약 행 — GET /mentor/v1/recommendations. */
export interface MentorRecommendationSubmission {
  teamId: string
  cohortLabel: string
  teamName: string
  submittedAtLabel: string
  recommended: boolean
  /** '임도형 (AI/ML)' | '추천하지 않음' */
  targetLabel: string
  /** '184자 · 필수 충족' | '입력 없음 · 추천하지 않음' */
  summaryLabel: string
  /** 증명서 반영 기준 — '증명서 전체 공개 + 인증 완료 + 최신화 스냅샷 기준'(고정 정책) */
  certificateLabel: string
  /** 평가와 동일 — Figma 원문 행 유지(제출 후 수정 불가 정책과 충돌 openQuestion) */
  editDeadlineLabel: string
}

export interface MentorRecommendationsData {
  submissions: MentorRecommendationSubmission[]
}
