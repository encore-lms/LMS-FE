// 마일리지 쿼리 키 — 기능 로컬.
export const mileageKeys = {
  all: ['student', 'mileage'] as const,
  overview: () => [...mileageKeys.all, 'overview'] as const,
  products: () => [...mileageKeys.all, 'products'] as const,
  history: () => [...mileageKeys.all, 'history'] as const,
}
