// PLAY 쿼리 키 — 기능 로컬.
export const playKeys = {
  all: ['student', 'play'] as const,
  overview: () => [...playKeys.all, 'overview'] as const,
  typing: () => [...playKeys.all, 'typing'] as const,
  coding: () => [...playKeys.all, 'coding'] as const,
  quiz: () => [...playKeys.all, 'quiz'] as const,
}
