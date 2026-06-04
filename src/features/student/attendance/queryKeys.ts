// 출결 캐시 키 — 기능 로컬(공유 queryKeys 미오염). 무효화는 attendanceKeys.all 로.
export const attendanceKeys = {
  all: ['attendance'] as const,
  // 출결/태도 조회(요약·캘린더·제출이력 묶음)
  overview: (cohortId: string) =>
    [...attendanceKeys.all, 'overview', cohortId] as const,
  // 출결 폼 메타(canSubmit·latestSubmission)
  formMeta: (cohortId: string) =>
    [...attendanceKeys.all, 'form-meta', cohortId] as const,
} as const
