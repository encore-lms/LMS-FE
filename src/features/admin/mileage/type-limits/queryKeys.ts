// 운영 마일리지 타입 한도 캐시 키 — 기능 로컬(shared 미오염).
export const mileageTypeLimitsKeys = {
  all: ['admin-mileage-type-limits'] as const,
  config: () => [...mileageTypeLimitsKeys.all, 'config'] as const,
} as const
