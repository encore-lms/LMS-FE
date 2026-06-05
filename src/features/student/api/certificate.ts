import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { certKeys } from '../certificate/queryKeys'
import type {
  CertChangesData,
  CertificateOverview,
  CertPublicationData,
} from '../certificate/types'

// 수강 역량 증명서 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useCertificateOverview() {
  return useQuery({
    queryKey: certKeys.overview(),
    queryFn: () =>
      apiClient
        .get<CertificateOverview>('/student/certificate')
        .then((r) => r.data),
  })
}

/** 보완 요청 상세 — /student/certificate/changes */
export function useCertChanges() {
  return useQuery({
    queryKey: certKeys.changes(),
    queryFn: () =>
      apiClient
        .get<CertChangesData>('/student/certificate/changes')
        .then((r) => r.data),
  })
}

/** 공개 설정 — /student/certificate/publication */
export function useCertPublication() {
  return useQuery({
    queryKey: certKeys.publication(),
    queryFn: () =>
      apiClient
        .get<CertPublicationData>('/student/certificate/publication')
        .then((r) => r.data),
  })
}
