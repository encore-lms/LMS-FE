import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

// 강의 홈 공지 — 수강생(읽기)과 강사·매니저(작성·삭제)가 함께 쓰므로 shared 소유.
// 삭제 권한은 서버가 canDelete 로 판정한다(강사는 본인 글만, 매니저는 전부).

/** 공지에 붙은 링크. */
export interface NoticeLink {
  id: string
  url: string
}

/** 공지에 붙은 파일. */
export interface NoticeFile {
  id: string
  fileName: string
  fileSize: number | null
}

/** 공지 한 건. */
export interface NoticePost {
  id: string
  title: string
  content: string
  authorName: string
  authorRole: string
  roleLabel: string
  pinned: boolean
  createdAt: string
  timeAgo: string
  canDelete: boolean
  links: NoticeLink[]
  files: NoticeFile[]
}

export interface NoticePostList {
  notices: NoticePost[]
  canWrite: boolean
}

const noticeKeys = {
  all: ['course', 'notices'] as const,
  staff: (cohortId: string | undefined) =>
    ['course', 'notices', 'staff', cohortId] as const,
}

/** 수강생 — 본인 기수 공지. */
export function useCourseNotices() {
  return useQuery({
    queryKey: noticeKeys.all,
    queryFn: () =>
      apiClient
        .get<NoticePostList>('/student/course/notices')
        .then((r) => r.data),
  })
}

/** 강사·매니저 — 담당 기수 공지. */
export function useStaffCourseNotices(cohortId: string | undefined) {
  return useQuery({
    queryKey: noticeKeys.staff(cohortId),
    queryFn: () =>
      apiClient
        .get<NoticePostList>('/instructor/course/notices', { cohortId })
        .then((r) => r.data),
    enabled: !!cohortId,
  })
}

/** 작성 결과 — 파일은 공지를 만든 뒤 하나씩 올리므로, 실패한 파일 이름을 따로 돌려준다. */
export interface NoticeWriteResult {
  notice: NoticePost
  failedFiles: string[]
}

/**
 * 공지 작성.
 *
 * <p>링크는 본문과 함께 보내고, 파일은 공지가 생긴 뒤에 하나씩 올린다(서버가 noticeId 를
 * 요구한다). 파일이 하나 실패해도 공지 자체는 이미 올라간 상태라 통째로 실패로 알리지 않고,
 * 어떤 파일이 못 붙었는지 돌려준다.</p>
 */
export function useWriteCourseNotice(cohortId: string | undefined) {
  const qc = useQueryClient()
  return useMutation<
    NoticeWriteResult,
    Error,
    {
      title: string
      content: string
      pinned?: boolean
      urls?: string[]
      files?: File[]
    }
  >({
    mutationFn: async (input) => {
      const notice = await apiClient
        .post<NoticePost>(`/instructor/course/notices?cohortId=${cohortId ?? ''}`, {
          title: input.title,
          content: input.content,
          pinned: input.pinned,
          urls: input.urls,
        })
        .then((r) => r.data)

      const failedFiles: string[] = []
      for (const file of input.files ?? []) {
        const form = new FormData()
        form.append('file', file)
        try {
          await apiClient.postForm(
            `/instructor/course/notices/${notice.id}/attachments/file`,
            form,
          )
        } catch {
          failedFiles.push(file.name)
        }
      }
      return { notice, failedFiles }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: noticeKeys.all }),
  })
}

export function useDeleteCourseNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noticeId: string) =>
      apiClient.delete(`/instructor/course/notices/${noticeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: noticeKeys.all }),
  })
}

/** 첨부 삭제 — 링크·파일 모두. 글을 지울 수 있는 사람만 할 수 있다. */
export function useDeleteNoticeAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      noticeId,
      attachmentId,
    }: {
      noticeId: string
      attachmentId: string
    }) =>
      apiClient.delete(
        `/instructor/course/notices/${noticeId}/attachments/${attachmentId}`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: noticeKeys.all }),
  })
}

/**
 * 공지 첨부 파일 내려받기.
 *
 * <p>같은 파일이지만 경로가 갈린다 — BE 가 `/student/**` 를 STUDENT 로 잠가 두어, 강사·매니저가
 * 수강생 경로로 부르면 서비스 로직에 닿기도 전에 403 이 난다. 부르는 쪽이 자기 경로를 고른다.</p>
 */
export async function downloadNoticeAttachment(
  attachmentId: string,
  fileName: string,
  scope: 'student' | 'staff' = 'student',
) {
  const path =
    scope === 'staff'
      ? `/instructor/course/notices/attachments/${attachmentId}/file`
      : `/student/course/notices/attachments/${attachmentId}/file`
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
