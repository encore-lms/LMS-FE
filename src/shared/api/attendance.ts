import { apiClient } from './client'

// 출결 증빙 다운로드 — 수강생(본인)과 운영(담당 기수)이 함께 쓴다.
// feature 의 api 레이어는 비공개라, 교차 사용이 필요한 이 함수만 shared 로 승격했다.
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
