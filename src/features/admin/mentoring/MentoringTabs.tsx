import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

// 멘토링 클러스터 공통 sub-nav — 배정·일지·일지 템플릿·통계.
// 사이드바 '멘토링 관리'는 배정 화면으로만 진입 → 나머지 화면(일지·템플릿·통계)은
// 진입 링크가 없어 URL로만 도달하던 orphan이었음. 본 탭으로 상호 진입 링크를 확보한다.
const TABS: { label: string; to: string }[] = [
  { label: '배정', to: '/admin/mentors/assignments' },
  { label: '일지', to: '/admin/mentoring/logs' },
  { label: '일지 템플릿', to: '/admin/mentoring/log-templates' },
  { label: '통계', to: '/admin/mentoring/statistics' },
]

export function MentoringTabs() {
  return (
    <div className="border-border bg-surface mb-4 inline-flex flex-wrap gap-1 rounded-lg border p-1">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          className={({ isActive }) =>
            cn(
              'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              isActive ? 'bg-brand text-white' : 'text-fg-muted hover:text-fg',
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  )
}
