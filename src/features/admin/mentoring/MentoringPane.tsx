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
 * <p>기수 허브의 '멘토링' 탭에 들어간다. 배정 보드는 허브가 정한 기수로 고정하고 과정·기수
 * 셀렉터를 감춘다. 일지·템플릿·통계는 기수 단위 필드가 없어(과정명·상태 기준) 자체 필터를
 * 그대로 두고 화면만 임베드한다.</p>
 *
 * @param paramKey 하위 탭을 담는 쿼리 파라미터. 바깥 탭이 {@code tab} 을 쓰므로 겹치지 않게 받는다.
 */
export function MentoringPane({
  courseId,
  cohortId,
  paramKey = 'mtab',
}: {
  courseId: string
  cohortId: string
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
        {tab === 'logs' && <LogsPage embedded />}
        {tab === 'templates' && <LogTemplatesPage embedded />}
        {tab === 'statistics' && <StatisticsPage embedded />}
      </div>
    </div>
  )
}
