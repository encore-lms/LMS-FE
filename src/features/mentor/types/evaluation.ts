// 멘토 도메인 타입 — 팀 평가 4축 점수·시트·제출 요약(M4).
import type { MentorTeamMember } from './team'
// ───────────────────────── 평가 · 추천 (M4) ─────────────────────────

/**
 * 4축 점수 튜플 — 축 순서 고정(기술/기술기여 · 소통·협업·팀워크 · 문제해결 · 책임감).
 * 점수 범위는 1~5 가정(문서 미확정 TODO — Figma 캡션 '0~5점 필수'와 UI 1~5 세그먼트 충돌
 * openQuestion). 미입력 축은 null.
 */
// 2026-08-05 4축 개편 — 순서: 기술/기술기여 · 소통·협업·팀워크 · 문제해결 · 책임감.
export type EvaluationScoreTuple = [
  number | null,
  number | null,
  number | null,
  number | null,
]

/** 수강생 1명의 평가 입력 — 초안·제출 payload 공용(MentorEvaluationDraftRequest 대응). */
export interface MentorEvaluationDraftEntry {
  studentId: string
  scores: EvaluationScoreTuple
  /** 수강생별 줄글 평가 코멘트(필수, 최대 500자) — 원문은 내부 기록(수강생 비공개) */
  comment: string
}

/** PUT /mentor/v1/teams/{teamId}/evaluation/draft · POST .../evaluation/submit payload. */
export interface MentorEvaluationDraftPayload {
  entries: MentorEvaluationDraftEntry[]
}

/**
 * 평가 상태 — MentorEvaluationStatus 4종(P0_32_35 API명세).
 * ready_to_submit = 전원 4축 + 줄글 입력 완료(제출 전).
 */
export type MentorEvaluationStatus =
  | 'not_eligible'
  | 'draft'
  | 'ready_to_submit'
  | 'submitted'

/** 평가 카드 행 — 팀원 + 초안/제출 입력값 병합 read model. */
export interface MentorEvaluationMemberEntry extends MentorTeamMember {
  scores: EvaluationScoreTuple
  comment: string
}

/**
 * GET /mentor/v1/teams/{teamId}/evaluation — 평가 작성 화면 단일 응답.
 * 가능 조건: N시간 완료 또는 조기 종료(422 MENTOR_EVALUATION_NOT_ELIGIBLE), 잠금 사유 표시.
 */
export interface MentorEvaluationSheetData {
  teamId: string
  cohortLabel: string
  teamName: string
  memberCount: number
  allocatedHours: number
  recognizedHours: number
  /** N시간 완료 또는 조기 종료 — 평가 가능 */
  eligible: boolean
  /** hero 상태 칩 — 'N시간 완료 · 평가 가능' | '조기 종료 · 평가 가능' | 'N시간 미완료 · 평가 잠금' */
  eligibleLabel: string
  /** 잠금 사유 — eligible 이면 null */
  lockReasonLabel: string | null
  status: MentorEvaluationStatus
  /** 최종 제출 시각 — 미제출이면 null('2026-03-19 21:14') */
  submittedAtLabel: string | null
  /** 계약 종료 마감 — 경과 시 제출·재제출 잠금(읽기 전용) */
  submissionClosed: boolean
  /** 마감 라벨 '2026-12-28 까지' — 마감 없으면 null */
  submissionDeadlineLabel: string | null
  members: MentorEvaluationMemberEntry[]
}

/** 제출 완료 페이지 요약 행 — GET /mentor/v1/evaluations. */
export interface MentorEvaluationSubmission {
  teamId: string
  cohortLabel: string
  teamName: string
  submittedAtLabel: string // '2026-03-19 21:14'
  targetCount: number
  /** 축별 평균 — 축 순서 고정('기술 4.6 · 책임감 4.6 …' 표기용) */
  axisAverages: { label: string; value: number }[]
  commentsLabel: string // '5명 모두 작성'
  /**
   * '2026-03-20(금) 21:14 까지' — Figma 원문 '24시간 수정 마감' 행. 확정 정책(제출 후
   * 수정 불가 · PATCH/DELETE 없음)과 충돌(openQuestion) — 표기만 유지, 수정 진입 없음.
   */
  editDeadlineLabel: string
}

export interface MentorEvaluationsData {
  submissions: MentorEvaluationSubmission[]
}
