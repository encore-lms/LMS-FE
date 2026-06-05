// 수강생 "나의 과정" 캐시 키 — 기능 로컬(공유 queryKeys 미오염).
export const courseKeys = {
  all: ['student-course'] as const,
  home: () => [...courseKeys.all, 'home'] as const,
  materials: () => [...courseKeys.all, 'materials'] as const,
  assignments: () => [...courseKeys.all, 'assignments'] as const,
  assignment: (id: string) => [...courseKeys.all, 'assignment', id] as const,
  competency: () => [...courseKeys.all, 'competency'] as const,
} as const
