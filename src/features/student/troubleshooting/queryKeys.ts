// 트러블슈팅 쿼리 키 — 기능 로컬.
export const tsKeys = {
  all: ['student', 'troubleshooting'] as const,
  list: () => [...tsKeys.all, 'list'] as const,
  case: (id: string) => [...tsKeys.all, 'case', id] as const,
}
