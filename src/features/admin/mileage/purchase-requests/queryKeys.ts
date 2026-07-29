// 운영 마일리지 구매 요청 캐시 키 — 기능 로컬(shared 미오염).
export const mileagePurchaseKeys = {
  all: ['admin-mileage-purchase'] as const,
  queue: (cohortId = '') =>
    [...mileagePurchaseKeys.all, 'queue', cohortId] as const,
} as const
