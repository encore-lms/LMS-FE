import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'

// 설정 하위 화면 공통 브레드크럼 — [← 설정 허브] › 설정 › {현재} + 우측 route 칩.
export function SettingsBreadcrumb({
  current,
  route,
}: {
  current: string
  route: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to="/admin/settings"
        className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
      >
        <ArrowLeft className="h-3 w-3" /> 설정 허브
      </Link>
      <span className="text-fg-subtle text-sm">›</span>
      <span className="text-fg-muted text-xs font-medium">설정</span>
      <span className="text-fg-subtle text-sm">›</span>
      <span className="text-fg text-xs font-medium">{current}</span>
      <div className="ml-auto">
        <StatusBadge label={route} tone="neutral" />
      </div>
    </div>
  )
}
