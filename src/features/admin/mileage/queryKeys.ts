// 운영 마일리지 캐시 키 — 기능 로컬(shared/api/queryKeys.ts 미오염, admin/play·reputation 선례).
// BE 계약 확정 시 shared adminKeys 승격 검토 — shared PR 합의 필요.
export const adminMileageKeys = {
  all: ['admin-mileage'] as const,
  overview: () => [...adminMileageKeys.all, 'overview'] as const,
} as const
