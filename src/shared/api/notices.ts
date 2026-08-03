import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

// 강의 홈 공지 — 수강생(읽기)과 강사·매니저(작성·삭제)가 함께 쓰므로 shared 소유.
// 삭제 권한은 서버가 canDelete 로 판정한다(강사는 본인 글만, 매니저는 전부).

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

/** 공지 작성 — 본문 마크다운에 파일·북마크가 함께 담긴다. */
export function useWriteCourseNotice(cohortId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; content: string; pinned?: boolean }) =>
      apiClient.post<NoticePost>(
        `/instructor/course/notices?cohortId=${cohortId ?? ''}`,
        input,
      ),
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
