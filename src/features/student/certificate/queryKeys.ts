// 수강 역량 증명서 캐시 키 — 기능 로컬(공유 queryKeys 미오염).
export const certKeys = {
  all: ['student-certificate'] as const,
  overview: () => [...certKeys.all, 'overview'] as const,
  score: (studentId: string) =>
    [...certKeys.all, 'score-v4', studentId] as const,
  detailTabs: (studentId: string) =>
    [...certKeys.all, 'detail-tabs-v1', studentId] as const,
  changes: () => [...certKeys.all, 'changes'] as const,
  publication: () => [...certKeys.all, 'publication'] as const,
} as const
