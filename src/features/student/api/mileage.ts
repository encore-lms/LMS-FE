import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileageKeys } from '../mileage/queryKeys'
import type {
  MileageHistoryData,
  MileageOverview,
  MileageProductsData,
} from '../mileage/types'

// 마일리지 훅 — 엔드포인트가 /student/* 라 학생 feature 소유. baseURL /api 라 경로 앞 /api 생략.
export function useMileageOverview() {
  return useQuery({
    queryKey: mileageKeys.overview(),
    queryFn: () =>
      apiClient.get<MileageOverview>('/student/mileage').then((r) => r.data),
  })
}

export function useMileageProducts() {
  return useQuery({
    queryKey: mileageKeys.products(),
    queryFn: () =>
      apiClient
        .get<MileageProductsData>('/student/mileage/products')
        .then((r) => r.data),
  })
}

export function useMileageHistory() {
  return useQuery({
    queryKey: mileageKeys.history(),
    queryFn: () =>
      apiClient
        .get<MileageHistoryData>('/student/mileage/history')
        .then((r) => r.data),
  })
}

export interface MileageOrderRow {
  id: string
  product: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'canceled'
  statusLabel: string
  date: string
}
export interface MileageOrdersData {
  balance: string
  orders: MileageOrderRow[]
}

// 구매 요청 목록(실 BE §38/§39)
export function useMileageOrders() {
  return useQuery({
    queryKey: [...mileageKeys.all, 'orders'],
    queryFn: () =>
      apiClient
        .get<MileageOrdersData>('/student/mileage/orders')
        .then((r) => r.data),
  })
}
// 구매 요청(POST) — 성공 시 잔액·내역·주문 갱신
export function useCreateMileageOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      productId?: string
      quantity?: number
      requestedPrice?: number
      link?: string
      memo?: string
      items?: {
        productId: string
        quantity: number
        requestedPrice?: number
        link?: string
      }[]
    }) => apiClient.post('/student/mileage/orders', input),
    onSuccess: () => invalidateMileage(qc),
  })
}
// 구매 취소(POST) — 성공 시 잔액·내역·주문 갱신(환불 복원)
export function useCancelMileageOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) =>
      apiClient.post(`/student/mileage/orders/${orderId}/cancel`),
    onSuccess: () => invalidateMileage(qc),
  })
}
function invalidateMileage(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: [...mileageKeys.all, 'orders'] })
  void qc.invalidateQueries({ queryKey: mileageKeys.overview() })
  void qc.invalidateQueries({ queryKey: mileageKeys.history() })
  void qc.invalidateQueries({ queryKey: mileageKeys.products() })
}
