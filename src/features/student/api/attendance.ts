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
export function useAttendanceOverview(year?: number, month?: number) {
  const qs = year && month ? `?year=${year}&month=${month}` : ''
  return useQuery({
    queryKey: attendanceKeys.overview('me', year, month),
    queryFn: () =>
      apiClient
        .get<AttendanceOverview>(`/student/attendance/overview${qs}`)
        .then((r) => r.data),
    placeholderData: (prev) => prev, // 월 이동 시 이전 데이터 유지(깜빡임 방지)
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

/**
 * 출결 폼 증빙 업로드 — POST …/submissions/{id}/attachments (multipart).
 *
 * 예전에는 파일명 배열만 PATCH 로 보냈고 서버는 빈 스텁이라 아무것도 저장되지 않았다.
 * 증빙은 매니저가 실제로 열어봐야 하는 파일이라 바이트를 실어 보낸다.
 */
export function useUploadAttendanceAttachments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) => {
      const form = new FormData()
      for (const f of files) form.append('files', f)
      return apiClient.postForm<void>(
        `/student/attendance-forms/me/submissions/${id}/attachments`,
        form,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}

/** 증빙 삭제 — 본인 제출의 첨부만. */
export function useDeleteAttendanceAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      apiClient.delete<void>(
        `/student/attendance-forms/me/submissions/${id}/attachments/${attachmentId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}

/** 증빙 다운로드 — 본인 또는 담당 기수 운영·강사. */
export async function downloadAttendanceAttachment(
  attachmentId: string,
  fileName: string,
) {
  const blob = await apiClient.getBlob(
    `/student/attendance-forms/attachments/${attachmentId}/file`,
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

