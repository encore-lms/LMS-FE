import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

interface TabDef {
  label: string
  to: string
}

// 설정 하위 화면 공통 sub-route 탭 (Figma 허브 1284:8852 'tr' 행).
// URL 반영 정책: 탭별 sub-route — 활성 탭은 현재 경로로 판정.
// 계정 관리는 설정 탭 랜딩(/admin/settings)으로 통합 — 별도 운영 계정 권한 페이지 폐지.
const TABS: TabDef[] = [
  { label: '계정 관리', to: '/admin/settings' },
  { label: 'HRD API Key', to: '/admin/settings/hrd-api-key' },
  { label: '교육 과정 설정', to: '/admin/settings/course-config' },
  { label: '교육 과정 추가', to: '/admin/settings/courses/new' },
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
                ? 'bg-brand-deep text-on-color font-bold'
                : 'text-fg-muted hover:bg-surface-muted font-medium',
            )}
          >
            {t.label}
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
