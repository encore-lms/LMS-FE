import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

interface TabDef {
  label: string
  priority: 'P0' | 'P1'
  to: string
}

// 설정 하위 화면 공통 sub-route 탭 (Figma 허브 1284:8852 'tr' 행).
// URL 반영 정책: 탭별 sub-route — 활성 탭은 현재 경로로 판정.
const TABS: TabDef[] = [
  { label: '계정 관리', priority: 'P0', to: '/admin/settings/accounts' },
  { label: 'HRD API Key', priority: 'P1', to: '/admin/settings/hrd-api-key' },
  {
    label: '교육 과정 설정',
    priority: 'P1',
    to: '/admin/settings/course-config',
  },
  {
    label: '교육 과정 추가',
    priority: 'P1',
    to: '/admin/settings/courses/new',
  },
]

export function SettingsTabs({ right }: { right?: React.ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div className="border-border bg-surface mt-5 flex flex-wrap items-center gap-1 rounded-xl border p-1.5">
      {TABS.map((t) => {
        const active = pathname === t.to
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm',
              active
                ? 'bg-brand-deep font-bold text-white'
                : 'text-fg-muted hover:bg-surface-muted font-medium',
            )}
          >
            {t.label}
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-bold',
                active
                  ? 'bg-surface text-fg'
                  : 'bg-surface-muted text-fg-subtle',
              )}
            >
              {t.priority}
            </span>
          </Link>
        )
      })}
      {right && (
        <div className="text-fg-subtle ml-auto flex items-center gap-1 pr-2 text-xs">
          {right}
        </div>
      )}
    </div>
  )
}
