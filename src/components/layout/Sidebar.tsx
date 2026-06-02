import { NavLink } from 'react-router-dom'
import type { MenuItem } from './types'

// 사이드바 — Figma 디자인 반영(로고·섹션 라벨·활성 보라 액센트). 메뉴는 역할별 menu.ts 주입.
export function Sidebar({
  label,
  items,
}: {
  label: string
  items: MenuItem[]
}) {
  return (
    <aside className="border-border flex w-60 shrink-0 flex-col overflow-y-auto border-r bg-white">
      <div className="px-5 pt-6 pb-4 text-xl font-bold tracking-tight">
        <span className="text-brand">PLAY</span>
        <span className="text-accent">DATA</span>
      </div>
      {label && (
        <span className="text-fg-subtle px-5 pb-1 text-[10px] font-semibold">
          {label}
        </span>
      )}
      <nav className="flex flex-col gap-0.5 px-3 py-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `relative rounded-md px-3 py-2 text-[13px] ${
                isActive
                  ? 'bg-accent-bg text-fg font-semibold'
                  : 'text-fg hover:bg-divider font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="bg-accent absolute top-1/2 left-0 h-[18px] w-[3px] -translate-y-1/2 rounded-full" />
                )}
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
