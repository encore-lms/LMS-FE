import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/store'
import type { Role } from '@/shared/types'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import type { MenuItem } from './types'

// 인증 후 공통 레이아웃 셸. 활성 역할의 메뉴를 Sidebar에 주입한다.
// menus는 router에서 prop으로 전달받는다 → AppShell이 features에 직접 의존하지 않음(결합 해소).
export function AppShell({ menus }: { menus: Record<Role, MenuItem[]> }) {
  const { role } = useAuth()
  const menu = role ? menus[role] : []
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={menu} />
        <main className="flex-1 overflow-auto">
          <Suspense
            fallback={<div className="text-fg-muted p-8">불러오는 중…</div>}
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
