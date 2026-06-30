// 마일리지 금액 파싱 유틸.
// 구매/취소는 실 BE(MileageOrder §38/§39, BE #69)로 전환되어 store 시뮬(잔액/요청)은 제거했다.
// 잔액·내역·주문은 모두 실 BE(/student/mileage, /student/mileage/orders) 조회를 사용한다.

// "10,000M" | "10,000" → 10000
export function parseMoney(s: string | null | undefined): number {
  if (!s) return 0
  return Number(s.replace(/[^\d]/g, '')) || 0
}
