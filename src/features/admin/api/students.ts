import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type { StudentAttendanceData, AttendanceFormData } from '@/shared/types'

// ── 수강생 계정(auth-user-service /users/students) — HRD 동기화 등록·출결 ──
// 실 BE 전용(mock 모드에선 mock 토큰이라 401). 학생 화면 출결 탭 등은 별도 mock 유지.

// 수강생 계정 목록 훅은 강사 화면과도 공유되어 @/shared/api/students로 승격했다.
// 운영 화면은 이 배럴 재노출로 기존 import 경로(../api/students)를 그대로 유지한다.
export { useStudentAccounts } from '@/shared/api/students'

// 회차(기수) HRD-Net 훈련생 명단 — 동기화 입력. 온디맨드 호출.
export interface HrdTrainee {
  studentUuid: string
  name: string
  birth: string
  status: string
}
export function fetchHrdTrainees(courseId: string, cohortId: string) {
  return apiClient
    .get<
      HrdTrainee[]
    >(`/admin/courses/${courseId}/cohorts/${cohortId}/hrd-trainees`)
    .then((r) => r.data)
}

export interface SyncResult {
  created: number
  updated: number
  total: number
}
export interface SyncStudentsInput {
  cohortId: string
  students: { studentUuid: string; name: string; birth: string }[]
}
// HRD 명단을 계정에 동기화(생성/갱신). 성공 시 목록 무효화.
export function useSyncStudents() {
  const queryClient = useQueryClient()
  return useMutation<SyncResult, Error, SyncStudentsInput>({
    mutationFn: ({ cohortId, students }) =>
      apiClient
        .post<SyncResult>('/users/students/sync', {
          students: students.map((s) => ({ ...s, cohortId })),
        })
        .then((r) => r.data),
    onSuccess: () =>
      // prefix(...,'students')로 무효화 — 기수별 캐시 모두 갱신.
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, 'students'],
      }),
  })
}

// 관리자 출결 조회 — learning-service HRD 일별 출결(과정/기수/일자). 셋 다 있어야 조회.
export function useStudentAttendance(
  courseId?: string | null,
  cohortId?: string | null,
  date?: string,
) {
  return useQuery({
    queryKey: adminKeys.studentAttendance({
      courseId: courseId ?? undefined,
      cohortId: cohortId ?? undefined,
      date,
    }),
    enabled: !!courseId && !!cohortId && !!date,
    queryFn: () =>
      apiClient
        .get<StudentAttendanceData>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/attendance`,
          date ? { date } : {},
        )
        .then((r) => r.data),
  })
}

// 관리자 출결 폼 조회(조회 전용) — learning-service. 과정/기수 둘 다 있어야 조회.
export function useStudentAttendanceForms(
  courseId?: string | null,
  cohortId?: string | null,
) {
  return useQuery({
    queryKey: adminKeys.studentAttendanceForms({
      courseId: courseId ?? undefined,
      cohortId: cohortId ?? undefined,
    }),
    enabled: !!courseId && !!cohortId,
    queryFn: () =>
      apiClient
        .get<AttendanceFormData>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/attendance-forms`,
        )
        .then((r) => r.data),
  })
}

// ── 시연용 테스트 계정(POST/DELETE /users/students/test) ──
// 촬영 중 수강생 계정이 하나 더 필요할 때 매니저가 직접 만든다.
// 로그인 ID·비밀번호는 운영자가 정한다 — 바로 로그인해야 해서 기억할 수 있는 값이 낫다.
export interface TestStudentAccount {
  userId: string
  loginId: string
  name: string
  cohortId: string
}

export function useCreateTestStudent() {
  const queryClient = useQueryClient()
  return useMutation<
    TestStudentAccount,
    Error,
    { name: string; loginId: string; password: string; cohortId: string }
  >({
    mutationFn: (input) =>
      apiClient
        .post<TestStudentAccount>('/users/students/test', input)
        .then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        predicate: (q) => q.queryKey.includes('students'),
      }),
  })
}

// 테스트 표식이 없는 계정은 서버가 403으로 거절한다(실제 수강생 오삭제 방지).
export function useDeleteTestStudent() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (userId) =>
      apiClient.delete(`/users/students/test/${userId}`).then(() => undefined),
    onSuccess: () =>
      queryClient.invalidateQueries({
        predicate: (q) => q.queryKey.includes('students'),
      }),
  })
}
