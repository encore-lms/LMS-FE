import { Tabs } from '@/components/ui/Tabs'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import AssignmentsPage from './AssignmentsPage'
import LogsPage from './LogsPage'
import LogTemplatesPage from './LogTemplatesPage'
import StatisticsPage from './StatisticsPage'

type TabKey = 'assignments' | 'logs' | 'templates' | 'statistics'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'assignments', label: '배정' },
  { key: 'logs', label: '일지' },
  { key: 'templates', label: '일지 템플릿' },
  { key: 'statistics', label: '통계' },
]

/**
 * 멘토링 본문 — 배정·일지·일지 템플릿·통계.
 *
 * <p>기수 허브의 '멘토링' 탭에 들어간다. 배정·일지는 허브가 정한 기수로 조회하고, 통계는
 * 응답에 cohortId 가 없어 과정명+기수 라벨로 걸러낸다. 셋 다 같은 기수를 봐야 한 화면 안에서
 * 수가 어긋나지 않는다. 일지 템플릿만 기수 개념이 없어 그대로 둔다.</p>
 *
 * @param paramKey 하위 탭을 담는 쿼리 파라미터. 바깥 탭이 {@code tab} 을 쓰므로 겹치지 않게 받는다.
 */
export function MentoringPane({
  courseId,
  cohortId,
  courseName,
  cohortLabel,
  paramKey = 'mtab',
}: {
  courseId: string
  cohortId: string
  /** 통계 응답엔 cohortId 가 없어 표시 라벨로 맞춘다. */
  courseName?: string
  cohortLabel?: string
  paramKey?: string
}) {
  const [tab, setTab] = useSearchParamState(paramKey, 'assignments')

  return (
    <div>
      <Tabs
        variant="pill"
        aria-label="멘토링 탭"
        value={tab}
        onChange={setTab}
        items={TABS.map((t) => ({ value: t.key, label: t.label }))}
      />

      <div className="mt-6">
        {tab === 'assignments' && (
          <AssignmentsPage
            embedded
            scopeCourseId={courseId}
            scopeCohortId={cohortId}
          />
        )}
        {tab === 'logs' && <LogsPage embedded scopeCohortId={cohortId} />}
        {tab === 'templates' && <LogTemplatesPage embedded />}
        {tab === 'statistics' && (
          <StatisticsPage
            embedded
            scopeCourseName={courseName}
            scopeCohortLabel={cohortLabel}
          />
        )}
      </div>
    </div>
  )
}
