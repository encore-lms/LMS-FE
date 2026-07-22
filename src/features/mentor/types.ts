// 멘토 콘솔 도메인 타입 — feature-local(shared/types 무수정 컨벤션, student/mentoring 선례).
// BE 계약 확정 시 shared/types 승격 후보: 특히 MentorTeamAssignment 는 CONTRIBUTING 의
// 역할 교차 단일 소유 모델(수강생 멘토링 화면과 공유) — 승격은 shared PR 합의로 진행.
// 정본: P0_32_35 멘토 콘솔 API명세(/api/mentor/v1) · 2026-05-26(05-31 확정) 멘토 정책 결정 보고서.
// 도메인별 파일(types/)로 분할 — 이 파일은 기존 import 경로 유지용 재수출 전용.

export * from './types/team'
export * from './types/requests'
export * from './types/logs'
export * from './types/mentees'
export * from './types/evaluation'
export * from './types/recommendation'
