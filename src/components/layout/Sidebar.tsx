import { NavLink } from 'react-router-dom'
import type { MenuItem } from './types'

// 사이드바 골격 — 시각 polish는 페어 몫. 메뉴는 역할별 레지스트리(menu.ts)에서 주입한다.
export function Sidebar({ items }: { items: MenuItem[] }) {
  return (
    <aside className="border-border bg-surface-muted w-60 shrink-0 border-r">
      <nav className="flex flex-col gap-1 p-3">
        {items.length === 0 ? (
          <span className="text-fg-subtle px-3 py-2 text-sm">메뉴 준비 중</span>
        ) : (
          items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand text-white' : 'text-fg hover:bg-divider'}`
              }
            >
              {item.label}
            </NavLink>
          ))
        )}
      </nav>
    </aside>
  )
}
