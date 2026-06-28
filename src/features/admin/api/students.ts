import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type {
  StudentAccount,
  StudentAccountQueue,
  StudentAttendanceData,
  AttendanceFormData,
} from '@/shared/types'

// ── 수강생 계정(auth-user-service /users/students) — HRD 동기화 등록·목록 ──
// 실 BE 전용(mock 모드에선 mock 토큰이라 401). 학생 화면 출결 탭 등은 별도 mock 유지.

// auth-service 학생 목록 원본.
interface RawStudent {
  userId: string
  studentUuid: string
  name: string
  birth: string | null
  status: string // ACTIVE | INACTIVE | BLOCKED
  lastLoginAt: string | null
  createdAt: string
}
interface RawStudentPage {
  content: RawStudent[]
  totalElements: number
}

function toAccount(s: RawStudent): StudentAccount {
  return {
    id: s.userId,
    name: s.name,
    studentUuid: s.studentUuid,
    birthDate: s.birth ?? '-',
    joinedAt: s.createdAt ? s.createdAt.slice(5, 10) : '-',
    lastLoginAt: s.lastLoginAt ? s.lastLoginAt.slice(0, 10) : null,
    trainingStatus: s.status === 'INACTIVE' ? 'dropout' : 'active',
    loginBlocked: s.status === 'BLOCKED',
  }
}

// 수강생 계정 목록 — /users/students 실연동(StudentAccountQueue로 매핑해 기존 화면 유지).
// cohortId가 있으면 해당 기수 배정 학생만 조회(선택 즉시 목록 갱신).
export function useStudentAccounts(cohortId?: string | null) {
  return useQuery({
    queryKey: adminKeys.studentAccounts({ cohortId: cohortId ?? undefined }),
    queryFn: () =>
      apiClient
        .get<RawStudentPage>('/users/students', {
          size: 100,
          ...(cohortId ? { cohortId } : {}),
        })
        .then((r) => {
          const items = (r.data.content ?? []).map(toAccount)
          const queue: StudentAccountQueue = {
            cohortLabel: '전체',
            items,
            summary: {
              total: r.data.totalElements ?? items.length,
              normal: items.filter(
                (a) => !a.loginBlocked && a.trainingStatus !== 'dropout',
              ).length,
              loginBlocked: items.filter((a) => a.loginBlocked).length,
              lastSyncAt: '-',
              syncCreated: 0,
              syncExisting: 0,
            },
          }
          return queue
        }),
  })
}

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

export interface PasswordResetResult {
  userId: string
  temporaryPassword: string
}
// 임시 비밀번호 재발급(1회 표시).
export function useResetStudentPassword() {
  return useMutation<PasswordResetResult, Error, string>({
    mutationFn: (userId) =>
      apiClient
        .post<PasswordResetResult>(`/auth/accounts/${userId}/password/reset`)
        .then((r) => r.data),
  })
}

// 관리자 출결 조회 — learning-service HRD 월별 출결(과정/기수/월). 셋 다 있어야 조회.
export function useStudentAttendance(
  courseId?: string | null,
  cohortId?: string | null,
  month?: string,
) {
  return useQuery({
    queryKey: adminKeys.studentAttendance({
      courseId: courseId ?? undefined,
      cohortId: cohortId ?? undefined,
      month,
    }),
    enabled: !!courseId && !!cohortId,
    queryFn: () =>
      apiClient
        .get<StudentAttendanceData>(
          `/admin/courses/${courseId}/cohorts/${cohortId}/attendance`,
          month ? { month } : {},
        )
        .then((r) => r.data),
  })
}

export function useStudentAttendanceForms() {
  return useQuery({
    queryKey: adminKeys.studentAttendanceForms(),
    queryFn: () =>
      apiClient
        .get<AttendanceFormData>('/admin/students/attendance-forms')
        .then((r) => r.data),
  })
}
