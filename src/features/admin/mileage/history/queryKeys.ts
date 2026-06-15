// 운영 마일리지 지급 내역 캐시 키 — 기능 로컬(shared 미오염, admin/mileage 허브 선례).
export const mileageHistoryKeys = {
  all: ['admin-mileage-history'] as const,
  overview: () => [...mileageHistoryKeys.all, 'overview'] as const,
} as const
