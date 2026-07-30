import { Tabs } from '@/components/ui/Tabs'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { AccountsTab } from './AccountsTab'
import { AttendanceTab } from './AttendanceTab'
import { AttendanceFormTab } from './AttendanceFormTab'
import type { CohortScope } from './scope'

type TabKey = 'accounts' | 'attendance' | 'forms'

// 계정(동기화·관제)은 초기 세팅 후 사용 빈도가 낮아 맨 뒤로(운영 요구) — 일상 업무인 출결이 먼저.
const TABS: { key: TabKey; label: string }[] = [
  { key: 'attendance', label: '출결' },
  { key: 'forms', label: '출결 폼' },
  { key: 'accounts', label: '계정' },
]

/**
 * 학생 관리 본문 — 출결·출결 폼·계정 3탭.
 *
 * <p>단독 화면(/admin/students)과 기수 허브의 '수강생' 탭이 같은 본문을 쓴다. 두 자리에서
 * 화면이 갈라지지 않도록 본문을 여기 한 벌만 두고, 다른 것은 {@link CohortScope} 유무뿐이다 —
 * 허브에서는 기수를 골라 들어왔으니 과정·기수 선택 컨트롤이 사라진다.</p>
 *
 * @param paramKey 하위 탭을 담는 쿼리 파라미터. 허브는 바깥 탭이 이미 {@code tab} 을 쓰므로
 *                 겹치지 않게 다른 키를 준다.
 */
export function StudentsPane({
  scope,
  paramKey = 'tab',
}: {
  scope?: CohortScope
  paramKey?: string
}) {
  const [tab, setTab] = useSearchParamState(paramKey, 'attendance')

  return (
    <div>
      <Tabs
        variant="underline"
        aria-label="학생 관리 탭"
        value={tab}
        onChange={setTab}
        items={TABS.map((t) => ({ value: t.key, label: t.label }))}
      />

      <div className="mt-6">
        {tab === 'accounts' && <AccountsTab scope={scope} />}
        {tab === 'attendance' && <AttendanceTab scope={scope} />}
        {tab === 'forms' && <AttendanceFormTab scope={scope} />}
      </div>
    </div>
  )
}
