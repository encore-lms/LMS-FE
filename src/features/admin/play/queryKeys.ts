// 운영 PLAY 타자 관리 캐시 키 — 기능 로컬(shared/api/queryKeys.ts 미오염, admin/reputation·ingestion 선례).
// BE 계약 확정 시 shared adminKeys 승격 검토 — shared PR 합의 필요.
export const adminPlayKeys = {
  all: ['admin-play'] as const,
  overview: () => [...adminPlayKeys.all, 'overview'] as const,
} as const
