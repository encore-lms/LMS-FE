import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { certKeys } from '../certificate/queryKeys'
import type {
  CertChangesData,
  CertificateOverview,
  CertPublicationData,
  CertSentiment,
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

/**
 * AI 상담 감성 분석 — 녹음 후 음성→텍스트→키워드 추출 결과(버블) 반환.
 * 현재 BE 전 단계라 MSW 목(지연 후 결과). 실제 연동 시 payload를
 * FormData(audio Blob)로 교체하면 호출부는 그대로 유지된다.
 */
export function useAnalyzeSentiment() {
  return useMutation({
    mutationFn: (payload: { durationSec: number }) =>
      apiClient
        .post<CertSentiment>('/student/certificate/sentiment/analyze', payload)
        .then((r) => r.data),
  })
}

// ── 외부 공개 설정(실 BE) ──
// 공개 여부는 서버가 정본이다 — 검증 페이지는 다른 탭·다른 기기에서 열리므로
// 프론트 상태로는 전달할 수 없다.

export interface CertPublicationSettings {
  publicToken: string
  publicUrl: string
  published: boolean
  peerReputationPublic: boolean
  shortCommentPublic: boolean
}

export function useCertPublicationSettings() {
  return useQuery({
    queryKey: [...certKeys.publication(), 'settings'],
    queryFn: () =>
      apiClient
        .get<CertPublicationSettings>('/student/certificate/publication-settings')
        .then((r) => r.data),
  })
}

export function useUpdateCertPublication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      published?: boolean
      peerReputationPublic?: boolean
      shortCommentPublic?: boolean
    }) =>
      apiClient
        .patch<CertPublicationSettings>(
          '/student/certificate/publication-settings',
          input,
        )
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: certKeys.publication() }),
  })
}
