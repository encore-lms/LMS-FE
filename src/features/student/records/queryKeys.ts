// 기록실 쿼리 키 — 기능 로컬.
export const recordKeys = {
  all: ['student', 'records'] as const,
  overview: () => [...recordKeys.all, 'overview'] as const,
  blogForm: () => [...recordKeys.all, 'blog-form'] as const,
  blog: (id: string) => [...recordKeys.all, 'blog', id] as const,
  study: (id: string) => [...recordKeys.all, 'study', id] as const,
  cert: (id: string) => [...recordKeys.all, 'cert', id] as const,
}
