// 운영 과정·기수·교과목 캐시 키 — 기능 로컬(shared/api/queryKeys.ts 미오염, admin/mentoring 선례).
// BE 계약 확정 시 shared adminKeys 승격 검토 — shared PR 합의 필요.
export const adminEducationKeys = {
  all: ['admin-education'] as const,
  overview: () => [...adminEducationKeys.all, 'overview'] as const,
  courseDetail: (courseId: string, cohortId: string) =>
    [...adminEducationKeys.all, 'detail', courseId, cohortId] as const,
  assignments: (courseId: string, cohortId: string) =>
    [...adminEducationKeys.all, 'assignments', courseId, cohortId] as const,
  // 강사/운영 공용 과제(/instructor/assignments) — 기수 스코프
  cohortAssignments: (cohortId: string) =>
    [...adminEducationKeys.all, 'ia', cohortId] as const,
  assignmentSubmissions: (assignmentId: string) =>
    [...adminEducationKeys.all, 'ia-sub', assignmentId] as const,
  resumes: (courseId: string, cohortId: string) =>
    [...adminEducationKeys.all, 'resumes', courseId, cohortId] as const,
  projects: (courseId: string, cohortId: string) =>
    [...adminEducationKeys.all, 'projects', courseId, cohortId] as const,
  peerEvaluations: (projectId: string) =>
    [...adminEducationKeys.all, 'peer-evals', projectId] as const,
  // 강사·매니저 수강생 평가('수강생 평가' 탭) — 기수 스코프, 평가자 본인 시트
  staffStudentEvals: (cohortId: string) =>
    [...adminEducationKeys.all, 'staff-evals', cohortId] as const,
  resumeDetail: (courseId: string, cohortId: string, resumeId: string) =>
    [
      ...adminEducationKeys.all,
      'resume',
      courseId,
      cohortId,
      resumeId,
    ] as const,
} as const
