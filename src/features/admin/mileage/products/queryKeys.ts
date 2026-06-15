// 운영 마일리지 상품 캐시 키 — 기능 로컬(shared 미오염).
export const mileageProductsKeys = {
  all: ['admin-mileage-products'] as const,
  list: () => [...mileageProductsKeys.all, 'list'] as const,
} as const
