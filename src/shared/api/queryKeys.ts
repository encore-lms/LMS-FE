// 서버 상태 캐시 키 SSOT — 공유 읽기전용.
// 무효화는 항상 이 키로만: queryClient.invalidateQueries({ queryKey: quizKeys.all })
export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (filter?: { cohortId?: string }) =>
    [...quizKeys.lists(), { filter: filter ?? {} }] as const,
  questions: (quizId: string) =>
    [...quizKeys.all, 'questions', quizId] as const,
  result: (quizId: string) => [...quizKeys.all, 'result', quizId] as const,
} as const

// 운영(admin) 서버 상태 캐시 키.
export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  reviewQueue: (filter?: { status?: string }) =>
    [...adminKeys.all, 'reviews', { filter: filter ?? {} }] as const,
} as const
