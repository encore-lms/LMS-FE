import { ArrowLeft } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'

// 설정 하위 화면 공통 브레드크럼 — [← 설정 허브] › 설정 › {현재} (route 전달 시에만 우측 칩).
// 설정 허브(=계정 관리, /admin/settings)에서 클릭 시엔 같은 경로라 이동이 없으므로 새로고침한다.
export function SettingsBreadcrumb({
  current,
  route,
}: {
  current: string
  route?: string
}) {
  const { pathname } = useLocation()
  const atHub = pathname === '/admin/settings'
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to="/admin/settings"
        onClick={
          atHub
            ? (e) => {
                e.preventDefault()
                window.location.reload()
              }
            : undefined
        }
        className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
      >
        <ArrowLeft className="h-3 w-3" /> 설정 허브
      </Link>
      <span className="text-fg-subtle text-sm">›</span>
      <span className="text-fg-muted text-xs font-medium">설정</span>
      <span className="text-fg-subtle text-sm">›</span>
      <span className="text-fg text-xs font-medium">{current}</span>
      {route && (
        <div className="ml-auto">
          <StatusBadge label={route} tone="neutral" />
        </div>
      )}
    </div>
  )
}
