import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/store'
import { ROLE_LABEL } from '@/shared/constants'
import type { Role } from '@/shared/types'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import type { MenuNode } from './types'

// 인증 후 공통 레이아웃 — 사이드바 풀하이트(좌) + 헤더·콘텐츠(우). 활성 역할 메뉴를 Sidebar에 주입.
// menus는 router에서 prop으로 전달받는다 → AppShell이 features에 직접 의존하지 않음(결합 해소).
export function AppShell({ menus }: { menus: Record<Role, MenuNode[]> }) {
  const { role } = useAuth()
  const menu = role ? menus[role] : []
  const label = role ? ROLE_LABEL[role] : ''
  return (
    <div className="flex h-screen">
      <Sidebar label={label} items={menu} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
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
