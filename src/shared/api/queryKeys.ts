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
  settingsHub: () => [...adminKeys.all, 'settings', 'hub'] as const,
  settingsAccounts: () => [...adminKeys.all, 'settings', 'accounts'] as const,
  settingsHrdKeys: () => [...adminKeys.all, 'settings', 'hrd-keys'] as const,
  settingsCourses: () => [...adminKeys.all, 'settings', 'courses'] as const,
  settingsCourseConfig: (courseId: string) =>
    [...adminKeys.all, 'settings', 'courses', courseId] as const,
  settingsHrdSearch: (page: number) =>
    [...adminKeys.all, 'settings', 'hrd-search', { page }] as const,
} as const

// 강사(instructor) 서버 상태 캐시 키.
export const instructorKeys = {
  all: ['instructor'] as const,
  endorsements: () => [...instructorKeys.all, 'endorsements'] as const,
  endorsementHistory: () =>
    [...instructorKeys.all, 'endorsements', 'history'] as const,
  endorsementDetail: (endorsementId: string) =>
    [...instructorKeys.all, 'endorsements', endorsementId] as const,
  quizzes: () => [...instructorKeys.all, 'quizzes'] as const,
  quizDetail: (quizId: string) =>
    [...instructorKeys.all, 'quizzes', quizId] as const,
  quizQuestions: (quizId: string) =>
    [...instructorKeys.all, 'quizzes', quizId, 'questions'] as const,
  quizSubmissions: (quizId: string) =>
    [...instructorKeys.all, 'quizzes', quizId, 'submissions'] as const,
  quizGrading: (quizId: string, submissionId: string) =>
    [
      ...instructorKeys.all,
      'quizzes',
      quizId,
      'grading',
      submissionId,
    ] as const,
  dashboard: () => [...instructorKeys.all, 'dashboard'] as const,
  cohorts: () => [...instructorKeys.all, 'cohorts'] as const,
  cohortStudents: (cohortId: string) =>
    [...instructorKeys.all, 'cohorts', cohortId, 'students'] as const,
  studentDetail: (studentId: string) =>
    [...instructorKeys.all, 'students', studentId] as const,
  quizTemplates: () => [...instructorKeys.all, 'quiz-templates'] as const,
  quizTemplateDetail: (templateId: string) =>
    [...instructorKeys.all, 'quiz-templates', templateId] as const,
  quizTemplateQuestions: (templateId: string) =>
    [...instructorKeys.all, 'quiz-templates', templateId, 'questions'] as const,
} as const
