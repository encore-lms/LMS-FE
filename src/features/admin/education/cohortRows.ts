import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminKeys } from '@/shared/api/queryKeys'
import type { CourseConfigDetail, CourseListItem } from '@/shared/types'

/** 담당 과정/기수 목록의 한 줄 — 과정 × 기수를 펼친 형태. */
export interface AdminCohortRow {
  cohortId: string
  courseId: string
  courseTitle: string
  cohortNo: string
  cohortLabel: string // '32기'
  startDate: string
  endDate: string
  hrdTrprId: string | null
  status: 'ongoing' | 'upcoming' | 'ended'
  dDayLabel: string | null
}

function statusOf(start: string, end: string, today: string) {
  if (end && end < today) return 'ended' as const
  if (start && start > today) return 'upcoming' as const
  return 'ongoing' as const
}

/** 종료까지 남은 일수 — 진행 중인 기수에만 붙인다(예정·종료엔 의미가 없다). */
function dDayOf(end: string, today: string) {
  if (!end) return null
  const diff = Math.ceil(
    (new Date(`${end}T00:00:00`).getTime() -
      new Date(`${today}T00:00:00`).getTime()) /
      86_400_000,
  )
  return diff >= 0 ? `D-${diff}` : null
}

/**
 * 등록 과정 전체의 기수를 한 목록으로 펼친다.
 *
 * <p>매니저용 기수 목록 API 가 따로 없어 과정 상세(GET /admin/courses/{id})를 과정 수만큼
 * 병렬로 불러 합친다. 과정은 보통 한 자릿수라 이 정도면 충분하고, 집계 API 가 생기면
 * 이 훅만 갈아 끼우면 된다.</p>
 */
export function useAllCourseCohorts(courses: CourseListItem[] | undefined) {
  const list = courses ?? []
  const results = useQueries({
    queries: list.map((c) => ({
      queryKey: adminKeys.settingsCourseConfig(c.courseId),
      queryFn: () =>
        apiClient
          .get<CourseConfigDetail>(`/admin/courses/${c.courseId}`)
          .then((r) => r.data),
    })),
  })

  const today = new Date().toISOString().slice(0, 10)
  const rows: AdminCohortRow[] = []
  results.forEach((res, i) => {
    const course = list[i]
    for (const c of res.data?.cohorts ?? []) {
      const start = c.startDate ?? ''
      const end = c.endDate ?? ''
      const status = statusOf(start, end, today)
      rows.push({
        cohortId: c.id,
        courseId: course.courseId,
        courseTitle: course.title,
        cohortNo: c.cohortNo,
        cohortLabel: `${c.cohortNo}기`,
        startDate: start || '-',
        endDate: end || '-',
        hrdTrprId: c.hrdTrprId,
        status,
        dDayLabel: status === 'ongoing' ? dDayOf(end, today) : null,
      })
    }
  })
  // 최근 기수가 위로 — 운영자가 주로 보는 쪽이다.
  rows.sort((a, b) => b.startDate.localeCompare(a.startDate))

  return {
    rows,
    isPending: list.length > 0 && results.some((r) => r.isPending),
    isError: results.some((r) => r.isError),
    refetch: () => results.forEach((r) => void r.refetch()),
  }
}
