// 멘토 콘솔 mock DB — 도메인별 파일(mockDb/)로 분할, 이 파일은 기존 import 경로 유지용 재수출 전용.
// 상태는 mockDb/db.ts 단일 소유(상태형 mock) — msw 자동 수집 글롭(features/**/mocks.ts)에
// 걸리지 않도록 mocks.ts(핸들러 전용)와 분리한 구조는 그대로 유지한다.

export type {
  MentorMockEvaluation,
  MentorMockLog,
  MentorMockRecommendation,
  MentorMockRequest,
  MentorMockReservation,
  MentorMockSlot,
  MentorMockTeam,
} from './mockDb/db'
export {
  EVALUATION_AXIS_LABELS,
  LOG_FIELD_SNAPSHOT,
  mentorDb,
} from './mockDb/db'

export { recognizeMinutes, toAssignment } from './mockDb/shared'

export {
  buildDashboardData,
  buildTeamDetailData,
  buildTeamsData,
} from './mockDb/teams'

export type {
  MentoringRequestMockAction,
  MentoringRequestMutationResult,
} from './mockDb/requests'
export {
  buildMentoringRequestDetail,
  buildMentoringRequestsData,
  respondToMentoringRequest,
  updateConfirmedDetails,
} from './mockDb/requests'

export type { MentoringLogMutationResult } from './mockDb/logs'
export {
  buildLogFieldSnapshot,
  buildMentoringLogDetail,
  buildMentoringLogTargets,
  buildMentoringLogsData,
  saveMentoringLogDraft,
  submitMentoringLog,
  updateMentoringLogDraft,
} from './mockDb/logs'

export { buildMenteeDetail } from './mockDb/mentees'

export type { MentorEvaluationMutationResult } from './mockDb/evaluations'
export {
  buildEvaluationsData,
  buildTeamEvaluationSheet,
  saveEvaluationDraft,
  submitEvaluation,
} from './mockDb/evaluations'

export type { MentorRecommendationMutationResult } from './mockDb/recommendations'
export {
  buildRecommendationsData,
  buildTeamRecommendationSheet,
  saveRecommendationDraft,
  submitRecommendation,
} from './mockDb/recommendations'
