import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/store'
import { ROLE_LABEL } from '@/shared/constants'
import type { Role } from '@/shared/types'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import type { MenuNode } from './types'

// 접힘 상태 저장 키 — 역할 공통(전 역할 같은 셸을 쓰므로 하나로 기억한다).
const SIDEBAR_COLLAPSED_KEY = 'lms-sidebar-collapsed'

// 인증 후 공통 레이아웃 — 사이드바 풀하이트(좌) + 헤더·콘텐츠(우). 활성 역할 메뉴를 Sidebar에 주입.
// menus는 router에서 prop으로 전달받는다 → AppShell이 features에 직접 의존하지 않음(결합 해소).
// 사이드바는 접었다 펼 수 있다(2026-08-08, 전 역할) — 토글은 헤더 좌측, 상태는 localStorage 유지.
export function AppShell({ menus }: { menus: Record<Role, MenuNode[]> }) {
  const { role } = useAuth()
  const menu = role ? menus[role] : []
  const label = role ? ROLE_LABEL[role] : ''
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
  )
  const toggleSidebar = () =>
    setCollapsed((current) => {
      const next = !current
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      return next
    })

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <Sidebar label={label} items={menu} collapsed={collapsed} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header sidebarCollapsed={collapsed} onToggleSidebar={toggleSidebar} />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {/* 라우트 청크 로딩 fallback — 각 페이지가 마운트 직후 자체 스켈레톤을 띄우므로
              여기서는 텍스트 대신 빈 화면을 둬서 '불러오는 중' 텍스트 깜빡임을 없앤다. */}
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
