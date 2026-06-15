import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminAuditKeys } from './queryKeys'
import type { AuditLogData } from './types'

// 증명서 감사 로그 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useAuditLog(certificateId: string) {
  return useQuery({
    queryKey: adminAuditKeys.detail(certificateId),
    queryFn: () =>
      apiClient
        .get<AuditLogData>(`/admin/certificates/${certificateId}/audit`)
        .then((r) => r.data),
    enabled: certificateId.length > 0,
  })
}
