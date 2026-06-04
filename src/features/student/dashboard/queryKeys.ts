// 수강생 대시보드 캐시 키 — 기능 로컬(공유 queryKeys 미오염).
export const dashboardKeys = {
  all: ['student-dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
} as const
