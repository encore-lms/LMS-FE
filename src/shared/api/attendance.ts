import { apiClient } from './client'

/**
 * 출결 증빙 다운로드 — 수강생(본인)과 운영(담당 기수)이 함께 쓴다.
 *
 * <p>같은 파일인데 경로가 갈리는 이유: BE 는 `/student/**` 를 STUDENT 역할로 잠가 두어,
 * 운영자가 수강생 경로로 부르면 서비스 로직에 닿기도 전에 403 이 난다. 권한 판정(본인 것이거나
 * 담당 기수 검토자)은 서비스가 이미 하고 있으므로, 부르는 쪽이 자기 경로를 고른다.</p>
 *
 * <p>feature 의 api 레이어는 비공개라, 교차 사용이 필요한 이 함수만 shared 로 승격했다.</p>
 */
export async function downloadAttendanceAttachment(
  attachmentId: string,
  fileName: string,
  scope: 'student' | 'admin' = 'student',
) {
  const path =
    scope === 'admin'
      ? `/admin/courses/attendance-forms/attachments/${attachmentId}/file`
      : `/student/attendance-forms/attachments/${attachmentId}/file`
  const blob = await apiClient.getBlob(path)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
