import { useQuery } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type { CertSnapshot } from '@/shared/types'

// 동결 스냅샷 상세.
export function useSnapshot(certificateId: string) {
  return useQuery({
    queryKey: adminKeys.snapshot(certificateId),
    queryFn: () =>
      apiClient
        .get<CertSnapshot>(`/admin/certificates/${certificateId}/snapshot`)
        .then((r) => r.data),
    enabled: !!certificateId,
  })
}
