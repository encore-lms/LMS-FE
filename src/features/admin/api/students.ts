import { useQuery } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type {
  StudentAccountQueue,
  StudentAttendanceData,
  AttendanceFormData,
} from '@/shared/types'

// 학생 관리 (/admin/students) — 계정·출결·출결 폼 3탭 데이터. baseURL이 /api라 경로 앞에 안 붙임.
export function useStudentAccounts() {
  return useQuery({
    queryKey: adminKeys.studentAccounts(),
    queryFn: () =>
      apiClient.get<StudentAccountQueue>('/admin/students').then((r) => r.data),
  })
}

export function useStudentAttendance() {
  return useQuery({
    queryKey: adminKeys.studentAttendance(),
    queryFn: () =>
      apiClient
        .get<StudentAttendanceData>('/admin/students/attendance')
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
