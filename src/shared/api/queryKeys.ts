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
  reviewDetail: (reviewId: string) =>
    [...adminKeys.all, 'reviews', reviewId] as const,
  snapshot: (certificateId: string) =>
    [...adminKeys.all, 'snapshot', certificateId] as const,
  recordReviewQueue: (filter?: { category?: string; status?: string }) =>
    [...adminKeys.all, 'record-reviews', { filter: filter ?? {} }] as const,
  studentAccounts: (filter?: { status?: string }) =>
    [...adminKeys.all, 'students', { filter: filter ?? {} }] as const,
  studentAttendance: () =>
    [...adminKeys.all, 'students', 'attendance'] as const,
  studentAttendanceForms: () =>
    [...adminKeys.all, 'students', 'attendance-forms'] as const,
} as const
