import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { AccountsTab } from './AccountsTab'
import { AttendanceTab } from './AttendanceTab'
import { AttendanceFormTab } from './AttendanceFormTab'

type TabKey = 'accounts' | 'attendance' | 'forms'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'accounts', label: '계정' },
  { key: 'attendance', label: '출결' },
  { key: 'forms', label: '출결 폼' },
]

// 운영 학생 관리 (/admin/students) — 계정·출결·출결 폼 3탭. (Figma Main Flow 09)
// MANAGER 전용: HRD-Net 명단 동기화·계정 관제 + 출결/출결 폼 검토를 한 화면에 묶는다.
export default function StudentManagementPage() {
  const [tab, setTab] = useState<TabKey>('accounts')

  return (
    <div className="p-8">
      <p className="text-fg-subtle text-xs">운영 › 학생 관리</p>
      <div className="mt-1 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-fg text-2xl font-bold">학생 관리</h1>
          <p className="text-fg-muted mt-1 text-sm">
            MANAGER 전용 · HRD-Net 동기화 · 계정·출결·출결 폼 관제
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge label="MANAGER 전용" tone="accent" />
          <StatusBadge label="/admin/students" tone="neutral" />
        </div>
      </div>

      <div className="border-divider mt-5 flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium',
              tab === t.key
                ? 'text-brand border-brand border-b-2'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'accounts' && <AccountsTab />}
        {tab === 'attendance' && <AttendanceTab />}
        {tab === 'forms' && <AttendanceFormTab />}
      </div>
    </div>
  )
}
