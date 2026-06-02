import axios from 'axios'
import type { ApiResponse } from '@/shared/types'
import { useAuthStore } from '@/shared/store'

// axios instance — 요청에 토큰 자동 첨부, 401 응답 시 세션 초기화(가드가 로그인으로 보냄).
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

instance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clearSession()
    }
    return Promise.reject(error)
  },
)

// HTTP 클라이언트 계약 — 공유 읽기전용. (시그니처 고정: 소비자 코드 불변)
export interface ApiClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>>
  post<T>(url: string, body?: unknown): Promise<ApiResponse<T>>
  put<T>(url: string, body?: unknown): Promise<ApiResponse<T>>
  delete<T>(url: string): Promise<ApiResponse<T>>
}

export const apiClient: ApiClient = {
  async get<T>(url: string, params?: Record<string, unknown>) {
    const res = await instance.get<ApiResponse<T>>(url, { params })
    return res.data
  },
  async post<T>(url: string, body?: unknown) {
    const res = await instance.post<ApiResponse<T>>(url, body)
    return res.data
  },
  async put<T>(url: string, body?: unknown) {
    const res = await instance.put<ApiResponse<T>>(url, body)
    return res.data
  },
  async delete<T>(url: string) {
    const res = await instance.delete<ApiResponse<T>>(url)
    return res.data
  },
}
