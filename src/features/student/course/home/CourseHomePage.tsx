import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useCourseHome } from '../../api/course'
import { CourseTabs } from '../CourseTabs'
import { CourseHero } from './components/CourseHero'
import { CourseKpiCards } from './components/CourseKpiCards'
import { WeekLearningCard } from './components/WeekLearningCard'
import { MiniListCard } from './components/MiniListCard'
import { CourseNoticeCard } from './components/CourseNoticeCard'

/**
 * 강의 홈 (/student/course) — 나의 과정 랜딩. 탭바 + 히어로 + KPI4 + 주차별 학습/사이드 + 공지.
 * 데이터/상태만 여기서 다루고 각 영역은 components/* 가 그린다(영역별 격리).
 */
export default function CourseHomePage() {
  const { data, isPending, isError, refetch } = useCourseHome()

  if (isPending) {
    return <div className="text-fg-muted p-8">강의 홈을 불러오는 중…</div>
  }
  if (isError) {
    return (
      <div className="p-8">
        <Empty
          title="강의 홈을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <CourseTabs />
      <CourseHero hero={data.hero} />
      <CourseKpiCards kpis={data.kpis} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <WeekLearningCard
          title={data.weeksTitle}
          subtitle={data.weeksSubtitle}
          weeks={data.weeks}
        />
        <div className="flex w-full flex-col gap-4 lg:w-[344px]">
          {data.sideCards.map((card) => (
            <MiniListCard key={card.key} card={card} />
          ))}
        </div>
      </div>
      <CourseNoticeCard notices={data.notices} />
    </div>
  )
}
