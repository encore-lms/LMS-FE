// 마이 프로필 캐시 키 — 기능 로컬(공유 queryKeys 미오염).
export const profileKeys = {
  all: ['student-profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
  githubIdentity: () => [...profileKeys.all, 'github-identity'] as const,
} as const
