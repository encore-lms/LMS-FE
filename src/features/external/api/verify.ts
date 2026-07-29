import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { ExternalCertificateVerificationResponse } from '../verify/types'

// 외부 검증 캐시 키 — 비로그인 public이라 shared queryKeys(페어 계약) 대신 feature-local 상수.
// shared 승격 시 shared/api/queryKeys.ts에 externalKeys 신설.
export const externalVerifyKeys = {
  all: ['external-verify'] as const,
  verify: (publicToken: string) =>
    [...externalVerifyKeys.all, publicToken] as const,
}

/**
 * GET /verify/:publicToken — 비로그인 공개 검증 조회.
 * pending = 진입 로딩 화면(540:2907), 응답 도착 시 resultType별 즉시 분기.
 * 실패도 200 + resultType으로 받으므로(명세) 에러 분기는 네트워크 장애 정도만 남는다.
 * apiClient의 401 인터셉터는 이 엔드포인트가 401을 주지 않아 무해.
 */
export function useVerifyCertificate(publicToken: string) {
  return useQuery({
    queryKey: externalVerifyKeys.verify(publicToken),
    queryFn: () =>
      apiClient
        .get<ExternalCertificateVerificationResponse>(`/verify/${publicToken}`)
        .then((r) => r.data),
    enabled: !!publicToken,
  })
}
