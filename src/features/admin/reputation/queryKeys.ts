// 운영 평판 관리 캐시 키 — 기능 로컬(shared/api/queryKeys.ts 미오염, admin/ingestion·csv 선례).
// BE 계약 확정 시 shared adminKeys 승격 검토 — shared PR 합의 필요.
export const adminReputationKeys = {
  all: ['admin-reputation'] as const,
  // 조회 범위 기수가 결과(표·요약)를 바꾸므로 키에 포함한다.
  overview: (cohortIds: string[] = []) =>
    [...adminReputationKeys.all, 'overview', ...cohortIds] as const,
  mentorEvaluation: (studentId: string) =>
    [...adminReputationKeys.all, 'mentor-evaluation', studentId] as const,
} as const
