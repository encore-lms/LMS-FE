import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminKeys } from '@/shared/api/queryKeys'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { CourseHero } from '@/features/student/course/home/components/CourseHero'
import { CourseNoticeCard } from '@/features/student/course/home/components/CourseNoticeCard'
import { MiniListCard } from '@/features/student/course/home/components/MiniListCard'
import { WeekLearningCard } from '@/features/student/course/home/components/WeekLearningCard'
import type { CourseHome } from '@/features/student/course/types'

/**
 * 과정 홈 — 이 기수의 수강생이 보는 강의 홈을 운영자도 그대로 본다.
 *
 * <p>히어로(주차 진도)·주차별 학습(그 주에 배우는 교과목)·공지·미니 카드까지 수강생 화면의
 * 컴포넌트를 그대로 쓴다. 운영자가 문의를 받았을 때 다른 화면을 보고 있으면 같은 것을 놓고
 * 이야기할 수 없다 — 그래서 BE 집계도 한 코드({@code CourseHomeService})를 공유하고, 기수를
 * 찾는 방법만 다르다(수강생=본인 배정, 운영=URL 의 기수).</p>
 *
 * <p>수강생 화면의 탭바는 빼 둔다. 여기서는 바깥 허브 탭이 그 역할을 한다.</p>
 */
export function CourseHomePane({ cohortId }: { cohortId: string }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: adminKeys.cohortHome(cohortId),
    queryFn: () =>
      apiClient
        .get<CourseHome>(`/admin/cohorts/${cohortId}/home`)
        .then((r) => r.data),
  })

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError}
      onRetry={refetch}
      skeleton={<SkeletonListPage columns={4} className="" />}
      errorTitle="과정 홈을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
    >
      {data && (
        <div className="flex flex-col gap-5">
          <CourseHero hero={data.hero} />
          <CourseNoticeCard notices={data.notices} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <WeekLearningCard
              title={data.weeksTitle}
              subtitle={data.weeksSubtitle}
              weeks={data.weeks}
              currentWeek={data.hero.currentWeek}
            />
            <div className="flex w-full flex-col gap-4 lg:w-[344px]">
              {data.sideCards.map((card) => (
                <MiniListCard key={card.key} card={card} />
              ))}
            </div>
          </div>
        </div>
      )}
    </DataBoundary>
  )
}
