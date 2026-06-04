import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { attendanceKeys } from '../attendance/queryKeys'
import type {
  AttendanceOverview,
  AttendanceFormMeta,
  AttendanceFormSubmission,
  AttendanceFormPayload,
} from '../attendance/types'

// 수강생 전용 출결 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// queryFn에서 .then(r => r.data)로 언래핑(apiClient는 ApiResponse<T>={data:T} 반환).
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다.
// cohort는 로그인한 본인 기준으로 자동 매칭 → 경로 세그먼트로 'me' 사용(§5 1과정 1:1).

/** 출결/태도 조회 — 요약·HRD 캘린더·제출 이력 묶음 (조회 화면) */
export function useAttendanceOverview() {
  return useQuery({
    queryKey: attendanceKeys.overview('me'),
    queryFn: () =>
      apiClient
        .get<AttendanceOverview>('/student/attendance/overview')
        .then((r) => r.data),
  })
}

/** 출결 폼 메타 — canSubmit·latestSubmission (폼 화면 진입 시) */
export function useAttendanceFormMeta() {
  return useQuery({
    queryKey: attendanceKeys.formMeta('me'),
    queryFn: () =>
      apiClient
        .get<AttendanceFormMeta>('/student/attendance-forms/me')
        .then((r) => r.data),
  })
}

/** 출결 폼 제출 — 같은 cohort 마지막 1건 덮어쓰기. 성공 시 출결 캐시 무효화 */
export function useSubmitAttendanceForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AttendanceFormPayload) =>
      apiClient
        .post<AttendanceFormSubmission>(
          '/student/attendance-forms/me/submissions',
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}
