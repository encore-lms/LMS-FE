// 멘토 콘솔 캐시 키 — 기능 로컬(공유 queryKeys.ts 미오염, student/mentoring 선례).
// BE 계약 확정 시 shared/api/queryKeys.ts 승격 검토(mentorKeys) — shared PR 합의 필요.
export const mentorKeys = {
  all: ['mentor'] as const,
  dashboard: () => [...mentorKeys.all, 'dashboard'] as const,
  teams: () => [...mentorKeys.all, 'teams'] as const,
  teamDetail: (teamId: string) => [...mentorKeys.all, 'teams', teamId] as const,
  requests: () => [...mentorKeys.all, 'mentoring-requests'] as const,
  requestDetail: (requestId: string) =>
    [...mentorKeys.all, 'mentoring-requests', requestId] as const,
  logs: () => [...mentorKeys.all, 'mentoring-logs'] as const,
  logDetail: (logId: string) =>
    [...mentorKeys.all, 'mentoring-logs', logId] as const,
  logTargets: () => [...mentorKeys.all, 'mentoring-logs', 'targets'] as const,
  logFields: (teamId: string) =>
    [...mentorKeys.all, 'teams', teamId, 'log-field-snapshot'] as const,
  mentee: (studentId: string) =>
    [...mentorKeys.all, 'mentees', studentId] as const,
  teamEvaluation: (teamId: string) =>
    [...mentorKeys.all, 'teams', teamId, 'evaluation'] as const,
  teamRecommendation: (teamId: string) =>
    [...mentorKeys.all, 'teams', teamId, 'recommendation'] as const,
  evaluations: () => [...mentorKeys.all, 'evaluations'] as const,
  recommendations: () => [...mentorKeys.all, 'recommendations'] as const,
} as const
