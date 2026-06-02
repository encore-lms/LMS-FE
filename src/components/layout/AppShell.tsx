import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import type { MenuItem } from './types'

// 인증 후 공통 레이아웃 셸. 각 역할 페이지가 <Outlet/>에 lazy 로드된다.
// TODO(pair): useAuth().role에 따라 features/<role>/menu.ts 레지스트리에서 메뉴를 선택해 Sidebar에 주입.
export function AppShell() {
  const menu: MenuItem[] = []
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
