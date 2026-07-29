// API 응답/에러 계약 — 공유 읽기전용. (BE 계약 확정 시 페어가 shared PR로 갱신)

export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  status: number
  code: string
  message: string
}
