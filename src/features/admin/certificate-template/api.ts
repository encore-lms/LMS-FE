import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminCertTemplateKeys } from './queryKeys'
import type { CertTemplateOverview } from './types'

// 증명서 템플릿 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useCertificateTemplate() {
  return useQuery({
    queryKey: adminCertTemplateKeys.overview(),
    queryFn: () =>
      apiClient
        .get<CertTemplateOverview>('/admin/certificate-template')
        .then((r) => r.data),
  })
}
