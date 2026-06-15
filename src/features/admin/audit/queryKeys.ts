// 운영 감사 로그 캐시 키 — 기능 로컬(shared 미오염).
export const adminAuditKeys = {
  all: ['admin-audit'] as const,
  detail: (certificateId: string) =>
    [...adminAuditKeys.all, certificateId] as const,
} as const
