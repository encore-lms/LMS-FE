// 운영 멘토링 캐시 키 — 기능 로컬(공유 queryKeys.ts 미오염, student/mentoring·mentor 선례).
// BE 계약 확정 시 shared/api/queryKeys.ts(adminKeys) 승격 검토 — shared PR 합의 필요.
export const adminMentoringKeys = {
  all: ['admin-mentoring'] as const,
  assignments: () => [...adminMentoringKeys.all, 'assignments'] as const,
  logs: () => [...adminMentoringKeys.all, 'logs'] as const,
  logDetail: (logId: string) =>
    [...adminMentoringKeys.all, 'logs', logId] as const,
} as const
