// 멘토 콘솔 캐시 키 — 기능 로컬(공유 queryKeys.ts 미오염, student/mentoring 선례).
// BE 계약 확정 시 shared/api/queryKeys.ts 승격 검토(mentorKeys) — shared PR 합의 필요.
export const mentorKeys = {
  all: ['mentor'] as const,
  dashboard: () => [...mentorKeys.all, 'dashboard'] as const,
  teams: () => [...mentorKeys.all, 'teams'] as const,
  teamDetail: (teamId: string) => [...mentorKeys.all, 'teams', teamId] as const,
} as const
