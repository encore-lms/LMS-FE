import { HeroBanner } from '@/components/data/HeroBanner'
import type { CourseHero as CourseHeroType } from '../../types'

// 강의 홈 히어로 — 과정/기수·교육기간·진행률. 모양은 공용 HeroBanner(운영 과정 상세·멘토 팀
// 상세와 같은 띠), 여기서는 과정 값을 그 자리에 꽂기만 한다.
export function CourseHero({ hero }: { hero: CourseHeroType }) {
  return (
    <HeroBanner
      eyebrow={hero.trackLabel}
      title={`${hero.courseName} · ${hero.cohortName}`}
      meta={[
        `교육 기간 ${hero.periodStart} — ${hero.periodEnd}`,
        `${hero.currentWeek}주차 / ${hero.totalWeeks}주 진행 중`,
      ]}
      badgeLabel="진행률"
      badgeValue={`${hero.progressPct}%`}
      progressPct={hero.progressPct}
      progressLabel={hero.progressLabel}
      progressSubLabel={hero.progressSubLabel}
    />
  )
}
