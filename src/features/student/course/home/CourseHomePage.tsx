import { DataBoundary } from '@/components/ui/DataBoundary'
import { usePageHeader, useAuth } from '@/shared/store'
import { useCourseHome } from '../../api/course'
import { CourseTabs } from '../CourseTabs'
import { OnlineCoursePage } from '../online/OnlineCoursePage'
import { CourseHero } from './components/CourseHero'
import { CourseKpiCards } from './components/CourseKpiCards'
import { WeekLearningCard } from './components/WeekLearningCard'
import { MiniListCard } from './components/MiniListCard'
import { CourseNoticeCard } from './components/CourseNoticeCard'

/**
 * 나의 과정 (/student/course) 진입점 — 수강생 교육 타입으로 화면을 분기한다.
 * KDC(K-디지털 기초역량훈련) → 온라인 교육 화면, 그 외(KDT 등) → 기존 강의 홈.
 */
export default function CourseHomePage() {
  const { user } = useAuth()
  return user?.trainingType === 'KDC' ? <OnlineCoursePage /> : <KdtCourseHome />
}

/**
 * 강의 홈 — K-디지털 트레이닝(부트캠프형) 랜딩. 탭바 + 히어로 + KPI4 + 주차별 학습/사이드 + 공지.
 * 데이터/상태만 여기서 다루고 각 영역은 components/* 가 그린다(영역별 격리).
 */
function KdtCourseHome() {
  const { data, isPending, isError, refetch } = useCourseHome()
  usePageHeader('강의 홈')

  return (
    <div className="flex flex-col gap-5 p-8">
      <CourseTabs />
      <DataBoundary
        isPending={isPending}
        isError={isError}
        onRetry={refetch}
        errorTitle="강의 홈을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {data && (
          <>
            <CourseHero hero={data.hero} />
            <CourseKpiCards kpis={data.kpis} />
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
            <CourseNoticeCard notices={data.notices} />
          </>
        )}
      </DataBoundary>
    </div>
  )
}
