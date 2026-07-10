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
  recordSubmissionDetail: (category: string, submissionId: string) =>
    [
      ...adminKeys.all,
      'record-reviews',
      'detail',
      category,
      submissionId,
    ] as const,
  quizAnswers: (quizId: string) =>
    [...adminKeys.all, 'quizzes', quizId, 'answers'] as const,
  // 영향 계산 — quizAnswers의 하위 키(저장 후 quizAnswers 무효화에 함께 쓸려간다).
  // changeKey = 직렬화된 변경안(변경안이 다르면 다른 캐시).
  quizAnswerImpact: (quizId: string, changeKey?: string) =>
    [
      ...adminKeys.quizAnswers(quizId),
      'impact',
      { changeKey: changeKey ?? '' },
    ] as const,
  // 운영 수동 채점 — admin 전용 엔드포인트(강사 instructorKeys.quizGrading과 별개).
  quizGrading: (quizId: string, submissionId: string) =>
    [...adminKeys.all, 'quizzes', quizId, 'grading', submissionId] as const,
  studentAccounts: (filter?: { status?: string; cohortId?: string }) =>
    [...adminKeys.all, 'students', { filter: filter ?? {} }] as const,
  studentAttendance: (filter?: {
    courseId?: string
    cohortId?: string
    date?: string
  }) => [...adminKeys.all, 'students', 'attendance', filter ?? {}] as const,
  studentAttendanceForms: (filter?: { courseId?: string; cohortId?: string }) =>
    [...adminKeys.all, 'students', 'attendance-forms', filter ?? {}] as const,
  settingsAccounts: () => [...adminKeys.all, 'settings', 'accounts'] as const,
  // base prefix — 무효화는 이 키로(하위 list/summary/history가 모두 prefix 매칭됨).
  settingsHrdKeys: () => [...adminKeys.all, 'settings', 'hrd-keys'] as const,
  settingsHrdKeyList: (params: {
    page?: number
    size?: number
    query?: string
    active?: boolean
    sort?: string
  }) => [...adminKeys.all, 'settings', 'hrd-keys', 'list', params] as const,
  settingsHrdKeySummary: () =>
    [...adminKeys.all, 'settings', 'hrd-keys', 'summary'] as const,
  settingsHrdKeyHistory: (params: {
    page?: number
    size?: number
    action?: string
  }) => [...adminKeys.all, 'settings', 'hrd-keys', 'history', params] as const,
  settingsCourses: () => [...adminKeys.all, 'settings', 'courses'] as const,
  settingsCourseConfig: (courseId: string) =>
    [...adminKeys.all, 'settings', 'courses', courseId] as const,
  settingsCohortMaterials: (courseId: string, cohortId: string) =>
    [
      ...adminKeys.all,
      'settings',
      'courses',
      courseId,
      'cohorts',
      cohortId,
      'materials',
    ] as const,
  // 교육 과정 추가 HRD-Net 검색 — base prefix로 무효화(등록·제거 후 상태 갱신).
  settingsHrdSearch: (params?: {
    keyId?: string
    organ?: string
    title?: string
    from?: string
    to?: string
    page?: number
  }) => [...adminKeys.all, 'settings', 'hrd-search', params ?? {}] as const,
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
  recordReviews: (courseId: string, cohortId: string) =>
    [...instructorKeys.all, 'record-reviews', courseId, cohortId] as const,
  projectReviews: () => [...instructorKeys.all, 'project-reviews'] as const,
  tsReviews: () => [...instructorKeys.all, 'ts-reviews'] as const,
  changeRequests: () => [...instructorKeys.all, 'change-requests'] as const,
  recertifications: () => [...instructorKeys.all, 'recertifications'] as const,
  assignments: () => [...instructorKeys.all, 'assignments'] as const,
  assignmentCohortOptions: () =>
    [...instructorKeys.all, 'assignment-cohort-options'] as const,
  assignmentDetail: (assignmentId: string) =>
    [...instructorKeys.all, 'assignments', assignmentId] as const,
  assignmentSubmissions: (assignmentId: string) =>
    [
      ...instructorKeys.all,
      'assignments',
      assignmentId,
      'submissions',
    ] as const,
  quizTemplates: () => [...instructorKeys.all, 'quiz-templates'] as const,
  quizTemplateDetail: (templateId: string) =>
    [...instructorKeys.all, 'quiz-templates', templateId] as const,
  quizTemplateQuestions: (templateId: string) =>
    [...instructorKeys.all, 'quiz-templates', templateId, 'questions'] as const,
} as const
