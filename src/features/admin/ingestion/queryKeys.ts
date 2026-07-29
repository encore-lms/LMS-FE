// 운영 인입 격리 큐 캐시 키 — 기능 로컬(shared/api/queryKeys.ts 미오염, admin/csv·education 선례).
// BE 계약 확정 시 shared adminKeys 승격 검토 — shared PR 합의 필요.
export const adminIngestionKeys = {
  all: ['admin-ingestion'] as const,
  overview: () => [...adminIngestionKeys.all, 'overview'] as const,
} as const
