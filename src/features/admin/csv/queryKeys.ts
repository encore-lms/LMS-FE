// 운영 CSV 매핑 캐시 키 — 기능 로컬(shared/api/queryKeys.ts 미오염, admin/mentoring·education 선례).
// BE 계약 확정 시 shared adminKeys 승격 검토 — shared PR 합의 필요.
export const adminCsvKeys = {
  all: ['admin-csv'] as const,
  overview: () => [...adminCsvKeys.all, 'overview'] as const,
  datasets: () => [...adminCsvKeys.all, 'datasets'] as const,
  uploads: () => [...adminCsvKeys.all, 'uploads'] as const,
} as const
