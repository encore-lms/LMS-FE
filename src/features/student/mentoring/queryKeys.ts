// 수강생 멘토링 캐시 키 — 기능 로컬(공유 queryKeys 미오염).
export const mentoringKeys = {
  all: ['student-mentoring'] as const,
  detail: () => [...mentoringKeys.all, 'detail'] as const,
} as const
