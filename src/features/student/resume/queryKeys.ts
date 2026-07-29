// 이력서 캐시 키 — 기능 로컬(공유 queryKeys 미오염).
export const resumeKeys = {
  all: ['student-resume'] as const,
  list: () => [...resumeKeys.all, 'list'] as const,
  detail: (id: string) => [...resumeKeys.all, 'detail', id] as const,
} as const
