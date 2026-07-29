// 운영 마일리지 직접 지급 캐시 키 — 기능 로컬(shared 미오염).
export const mileageDirectPayKeys = {
  all: ['admin-mileage-direct-pay'] as const,
  roster: (cohortId = '') =>
    [...mileageDirectPayKeys.all, 'roster', cohortId] as const,
} as const
