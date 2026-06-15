// 운영 외부 연동 캐시 키 — 기능 로컬(shared 미오염).
export const adminIntegrationsKeys = {
  all: ['admin-integrations'] as const,
  overview: () => [...adminIntegrationsKeys.all, 'overview'] as const,
} as const
