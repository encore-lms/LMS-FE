// 운영 과정·기수·교과목 캐시 키 — 기능 로컬(shared/api/queryKeys.ts 미오염, admin/mentoring 선례).
// BE 계약 확정 시 shared adminKeys 승격 검토 — shared PR 합의 필요.
export const adminEducationKeys = {
  all: ['admin-education'] as const,
  overview: () => [...adminEducationKeys.all, 'overview'] as const,
  courseDetail: (courseId: string, cohortId: string) =>
    [...adminEducationKeys.all, 'detail', courseId, cohortId] as const,
} as const
