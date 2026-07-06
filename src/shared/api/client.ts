import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/shared/types'
import { useAuthStore } from '@/shared/store'

// axios instance — 요청에 토큰 자동 첨부, 401 응답 시 silent refresh 후 재시도(실패 시에만 세션 초기화).
const instance = axios.create({
  // 빈 문자열(.env의 VITE_API_BASE_URL=)도 '/api'로 폴백해야 하므로 ?? 가 아닌 || 사용.
  // (?? 는 ''를 통과시켜 baseURL이 비어 /api 없이 요청 → 404. .env.example "비우면 /api 폴백" 계약 준수.)
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// silent refresh — access token(TTL 30m) 만료 401 시 refresh 쿠키(httpOnly, path=/)로
// 재발급받아 원 요청을 1회 재시도한다. 없으면 실연동 페이지 이동 중 30분마다 강제 로그아웃된다.
// 동시 다발 401은 refresh 1회로 합류(single-flight). 재발급 실패 시에만 세션을 초기화한다.
let refreshPromise: Promise<string | null> | null = null

// 로그인 자체의 401(자격 증명 오류)과 refresh·logout은 재발급 재시도 대상이 아니다.
const REFRESH_EXEMPT_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout']

async function refreshAccessToken(): Promise<string | null> {
  try {
    // 크로스 오리진 배포(FE CloudFront ↔ API)에서도 쿠키가 전송되도록 credentials 포함.
    const res = await axios.post<ApiResponse<{ token: string }>>(
      `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
      undefined,
      { withCredentials: true },
    )
    const token = res.data.data.token
    useAuthStore.setState({ token })
    return token
  } catch {
    return null
  }
}

instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error)
    }
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    const url = original?.url ?? ''
    const exempt = REFRESH_EXEMPT_PATHS.some((path) => url.startsWith(path))
    const hadSession = useAuthStore.getState().token !== null

    if (!original || original._retry || exempt || !hadSession) {
      useAuthStore.getState().clearSession()
      return Promise.reject(error)
    }

    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null
    })
    const newToken = await refreshPromise
    if (!newToken) {
      useAuthStore.getState().clearSession()
      return Promise.reject(error)
    }
    original._retry = true
    original.headers.Authorization = `Bearer ${newToken}`
    return instance(original)
  },
)

// HTTP 클라이언트 계약 — 공유 읽기전용. (시그니처 고정: 소비자 코드 불변)
export interface ApiClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>>
  post<T>(url: string, body?: unknown): Promise<ApiResponse<T>>
  // 응답 body가 없는 POST(201 Created/204 No Content). ApiResponse 래퍼를 기대하지 않는다.
  postNoContent(url: string, body?: unknown): Promise<void>
  // multipart/form-data 전송(파일 업로드). Content-Type을 비워 axios가 boundary를 자동 설정.
  postForm<T>(url: string, form: FormData): Promise<ApiResponse<T>>
  put<T>(url: string, body?: unknown): Promise<ApiResponse<T>>
  // PATCH — 부분 갱신(운영 수동 채점 grade 계약). 기존 메서드 시그니처는 불변(추가만).
  patch<T>(url: string, body?: unknown): Promise<ApiResponse<T>>
  delete<T>(url: string): Promise<ApiResponse<T>>
  // 바이너리 다운로드(자료실 파일). Blob을 그대로 반환(언래핑 없음).
  getBlob(url: string): Promise<Blob>
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
  async postNoContent(url: string, body?: unknown) {
    await instance.post(url, body)
  },
  async postForm<T>(url: string, form: FormData) {
    // Content-Type을 undefined로 두면 브라우저/axios가 boundary 포함 multipart 헤더를 채운다.
    const res = await instance.post<ApiResponse<T>>(url, form, {
      headers: { 'Content-Type': undefined },
    })
    return res.data
  },
  async put<T>(url: string, body?: unknown) {
    const res = await instance.put<ApiResponse<T>>(url, body)
    return res.data
  },
  async patch<T>(url: string, body?: unknown) {
    const res = await instance.patch<ApiResponse<T>>(url, body)
    return res.data
  },
  async delete<T>(url: string) {
    const res = await instance.delete<ApiResponse<T>>(url)
    return res.data
  },
  async getBlob(url: string) {
    const res = await instance.get<Blob>(url, { responseType: 'blob' })
    return res.data
  },
}
