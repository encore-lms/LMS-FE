import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import { useAuthStore } from '@/shared/store'
import type {
  CohortBoard,
  CohortHrdSummary,
  MyCohortRef,
  OperatorDashboard,
} from '../dashboard/types'

interface CourseSummary {
  courseId: string
  title: string
}

interface CourseDetail {
  courseId: string
  title: string
  cohorts: {
    id: string
    cohortNo: string
    startDate: string
    endDate: string
  }[]
}

// 내 담당 기수 — auth(배정 cohortId 목록) + learning(과정·기수 메타)을 합쳐 서술자로 만든다.
// 계정 관리에서 담당 기수를 바꾸면 이 훅 결과가 대시보드 스코프를 결정한다.
export function useMyCohorts() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: [...adminKeys.dashboard(), 'my-cohorts', userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyCohortRef[]> => {
      const assigned = await apiClient
        .get<string[]>(`/auth/accounts/${userId}/cohorts`)
        .then((r) => r.data)
      const courses = await apiClient
        .get<CourseSummary[]>('/admin/courses')
        .then((r) => r.data)
      const details = await Promise.all(
        courses.map((c) =>
          apiClient
            .get<CourseDetail>(`/admin/courses/${c.courseId}`)
            .then((r) => r.data),
        ),
      )
      const assignedSet = new Set(assigned)
      const all = details.flatMap((d) =>
        d.cohorts.map((ch) => ({
          cohortId: ch.id,
          courseId: d.courseId,
          courseName: d.title,
          cohortNo: ch.cohortNo,
          startDate: ch.startDate,
          endDate: ch.endDate,
        })),
      )
      // 담당 배정이 없으면(최고 관리자 등) 전체 기수로 폴백 — '담당 없음' 안내
      // 대신 실제 운영 현황을 보여준다. 배정된 매니저는 기존대로 담당 기수만.
      const mine =
        assigned.length === 0
          ? all
          : all.filter((ref) => assignedSet.has(ref.cohortId))
      return mine.sort((a, b) => Number(a.cohortNo) - Number(b.cohortNo))
    },
  })
}

/** 담당 기수 스켈레톤 보드(hasData=false) — HRD 라이브 병합 경로로 채워진다. */
function emptyBoard(r: MyCohortRef, today: string): CohortBoard {
  const status =
    today < r.startDate ? 'upcoming' : today > r.endDate ? 'ended' : 'operating'
  const daysLeft = Math.round(
    (new Date(`${r.endDate}T00:00:00`).getTime() -
      new Date(`${today}T00:00:00`).getTime()) /
      86_400_000,
  )
  return {
    cohortId: r.cohortId,
    courseName: r.courseName,
    cohortLabel: `${r.cohortNo}기`,
    startDate: r.startDate,
    endDate: r.endDate,
    status,
    daysLeft,
    hasData: false,
    students: null,
    attendance: null,
    assessment: null,
    weeklyCheck: null,
    issues: [],
    pending: null,
  }
}

// 배포 환경에서 /admin/dashboard 가 레거시(learning-service) 응답으로 라우팅될 수 있다
// (ops-service 미배포 시 ALB /admin/* → learning). ops 계약(hasData boolean)이 아니면
// 담당 기수 스켈레톤으로 정규화해 HRD 라이브 병합으로 구동한다(TypeError 크래시 방지).
function normalizeDashboard(
  data: OperatorDashboard,
  refs: MyCohortRef[],
): OperatorDashboard {
  const cohorts = data?.cohorts ?? []
  const isOpsShape = cohorts.every(
    (c) => typeof (c as { hasData?: unknown }).hasData === 'boolean',
  )
  const today = data?.today ?? new Date().toISOString().slice(0, 10)
  if (isOpsShape) {
    return {
      today,
      cohorts,
      quarantineCount: data?.quarantineCount ?? 0,
      upcoming: data?.upcoming ?? [],
    }
  }
  return {
    today,
    cohorts: refs.map((r) => emptyBoard(r, today)),
    quarantineCount: 0,
    upcoming: [],
  }
}

// 담당 기수 스코프 대시보드 집계 — operations-service(staging 원본 집계) 실연동.
// axios 기본 배열 직렬화(cohort[]=)가 Spring과 맞지 않아 쿼리스트링을 직접 구성한다.
export function useOperatorDashboard(refs: MyCohortRef[] | undefined) {
  const query = (refs ?? [])
    .map(
      (r) =>
        'cohort=' +
        encodeURIComponent(
          [r.cohortId, r.courseName, r.cohortNo, r.startDate, r.endDate].join(
            '|',
          ),
        ),
    )
    .join('&')
  return useQuery({
    queryKey: [...adminKeys.dashboard(), 'board', query],
    enabled: !!refs && refs.length > 0,
    queryFn: () =>
      apiClient
        .get<OperatorDashboard>(`/admin/dashboard?${query}`)
        .then((r) => normalizeDashboard(r.data, refs ?? [])),
  })
}

// CSV 미인입 기수의 HRD-Net 라이브 요약 — learning-service가 HRD 월별 출결을 집계한다.
// 개강 전(upcoming) 기수는 HRD에도 데이터가 없으므로 호출하지 않는다.
export function useHrdLiveSummaries(
  refs: MyCohortRef[] | undefined,
  boards: CohortBoard[] | undefined,
) {
  const targets = useMemo(() => {
    if (!refs || !boards) return []
    return boards
      .filter((b) => !b.hasData && b.status !== 'upcoming')
      .map((b) => refs.find((r) => r.cohortId === b.cohortId))
      .filter((r): r is MyCohortRef => !!r)
  }, [refs, boards])
  return useQuery({
    queryKey: [
      ...adminKeys.dashboard(),
      'hrd-live',
      targets.map((t) => t.cohortId).join(','),
    ],
    enabled: targets.length > 0,
    queryFn: async (): Promise<Record<string, CohortHrdSummary>> => {
      const entries = await Promise.all(
        targets.map(async (t) => {
          const summary = await apiClient
            .get<CohortHrdSummary>(
              `/admin/courses/${t.courseId}/cohorts/${t.cohortId}/attendance-summary`,
            )
            .then((r) => r.data)
          return [t.cohortId, summary] as const
        }),
      )
      return Object.fromEntries(entries)
    },
  })
}
