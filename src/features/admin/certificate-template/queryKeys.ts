// 운영 증명서 템플릿 캐시 키 — 기능 로컬(shared/api/queryKeys.ts 미오염, admin/mentoring·education 선례).
// BE 계약 확정 시 shared adminKeys 승격 검토 — shared PR 합의 필요.
export const adminCertTemplateKeys = {
  all: ['admin-cert-template'] as const,
  overview: () => [...adminCertTemplateKeys.all, 'overview'] as const,
} as const
