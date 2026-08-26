import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '@/shared/api'
import {
  CERTIFICATE_SEVEN_TAB_SCHEMA_VERSION,
  publicCertificateSevenTabsSchema,
} from '@/features/student/certificate/analysis'
import type { ExternalCertificateVerificationResponse } from '../verify/types'

const publicResultSchema = z
  .object({
    resultType: z.literal('certified_public'),
    verificationId: z.string().min(1),
    snapshotVersion: z.string().min(1),
    snapshotHash: z.string().min(1),
    publicSchemaVersion: z.literal(CERTIFICATE_SEVEN_TAB_SCHEMA_VERSION),
    publicPayload: z
      .object({
        schemaVersion: z.literal(CERTIFICATE_SEVEN_TAB_SCHEMA_VERSION),
        generatedAt: z.string().datetime({ offset: true }),
        tabs: publicCertificateSevenTabsSchema,
      })
      .strict(),
  })
  .strict()

const messageResultSchema = z.discriminatedUnion('resultType', [
  z
    .object({
      resultType: z.literal('certified_private'),
      verificationIdMasked: z.string(),
      messageCode: z.literal('CERTIFICATE_PRIVATE'),
    })
    .strict(),
  z
    .object({
      resultType: z.literal('not_certified'),
      messageCode: z.literal('CERTIFICATE_NOT_CERTIFIED'),
    })
    .strict(),
  z
    .object({
      resultType: z.literal('public_preparing'),
      verificationIdMasked: z.string(),
      messageCode: z.literal('CERTIFICATE_PUBLIC_PAYLOAD_NOT_READY'),
    })
    .strict(),
  z
    .object({
      resultType: z.literal('verification_disabled'),
      messageCode: z.literal('CERTIFICATE_TOKEN_DISABLED'),
    })
    .strict(),
  z
    .object({
      resultType: z.literal('invalid_token'),
      messageCode: z.literal('CERTIFICATE_TOKEN_INVALID'),
    })
    .strict(),
  z
    .object({
      resultType: z.literal('expired_token'),
      messageCode: z.literal('CERTIFICATE_TOKEN_EXPIRED'),
    })
    .strict(),
])

const verificationResponseSchema = z.union([
  publicResultSchema,
  messageResultSchema,
])

export function parseVerificationResponse(
  value: unknown,
): ExternalCertificateVerificationResponse {
  return verificationResponseSchema.parse(value)
}

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
        .get<unknown>(`/verify/${publicToken}`)
        .then((r) => parseVerificationResponse(r.data)),
    enabled: !!publicToken,
  })
}
