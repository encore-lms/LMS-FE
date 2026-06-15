// 운영 평판 관리 캐시 키 — 기능 로컬(shared/api/queryKeys.ts 미오염, admin/ingestion·csv 선례).
// BE 계약 확정 시 shared adminKeys 승격 검토 — shared PR 합의 필요.
export const adminReputationKeys = {
  all: ['admin-reputation'] as const,
  overview: () => [...adminReputationKeys.all, 'overview'] as const,
} as const
