import { Tabs } from '@/components/ui/Tabs'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
import { AccountsTab } from './AccountsTab'
import { AttendanceTab } from './AttendanceTab'
import { AttendanceFormTab } from './AttendanceFormTab'

type TabKey = 'accounts' | 'attendance' | 'forms'

// 계정(동기화·관제)은 초기 세팅 후 사용 빈도가 낮아 맨 뒤로(운영 요구) — 일상 업무인 출결이 먼저.
const TABS: { key: TabKey; label: string }[] = [
  { key: 'attendance', label: '출결' },
  { key: 'forms', label: '출결 폼' },
  { key: 'accounts', label: '계정' },
]

// 운영 학생 관리 (/admin/students) — 계정·출결·출결 폼 3탭. (Figma Main Flow 09)
// MANAGER 전용: HRD-Net 명단 동기화·계정 관제 + 출결/출결 폼 검토를 한 화면에 묶는다.
export default function StudentManagementPage() {
  const [tab, setTab] = useSearchParamState('tab', 'attendance')
  usePageHeader('학생 관리', '수강생 명단과 출결을 확인하고 계정을 관리합니다')

  return (
    <div className="p-8">
      <Tabs
        variant="underline"
        aria-label="학생 관리 탭"
        value={tab}
        onChange={setTab}
        items={TABS.map((t) => ({ value: t.key, label: t.label }))}
      />

      <div className="mt-6">
        {tab === 'accounts' && <AccountsTab />}
        {tab === 'attendance' && <AttendanceTab />}
        {tab === 'forms' && <AttendanceFormTab />}
      </div>
    </div>
  )
}
