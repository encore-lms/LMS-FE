import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import { useAuthStore } from '@/shared/store'
import type {
  CohortBoard,
  CohortHrdSummary,
  MyCohortRef,
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

/** 오늘(KST) — 예전에는 BE 응답의 today 를 썼다. 집계를 걷어낸 뒤로 클라이언트가 정한다. */
export function kstToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(),
  )
}

/** 담당 기수 보드 껍데기(hasData=false) — HRD 라이브 병합 경로로 채워진다. */
export function emptyBoard(r: MyCohortRef, today: string): CohortBoard {
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
  }
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
