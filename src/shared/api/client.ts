import type { ApiResponse } from '@/shared/types'

// HTTP 클라이언트 계약 — 공유 읽기전용.
// TODO(pair): axios v1 instance로 구현 (WBS §4.1 — 토큰 자동 첨부, 401·세션만료 인터셉터, baseURL/MSW).
//            아래 메서드 시그니처는 고정 — 페어가 내부만 axios로 배선하면 소비자 코드 불변.
export interface ApiClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>>
  post<T>(url: string, body?: unknown): Promise<ApiResponse<T>>
  put<T>(url: string, body?: unknown): Promise<ApiResponse<T>>
  delete<T>(url: string): Promise<ApiResponse<T>>
}

function notWired(): never {
  throw new Error(
    'apiClient 미배선 — src/shared/api/client.ts를 axios로 구현하세요 (WBS §4.1, TODO pair)',
  )
}

export const apiClient: ApiClient = {
  get: notWired,
  post: notWired,
  put: notWired,
  delete: notWired,
}
