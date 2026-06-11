import { Link, useLocation } from 'react-router-dom'
import type { MenuItem } from './types'

// 사이드바 — Figma 디자인 반영(로고·섹션 라벨·활성 보라 액센트). 메뉴는 역할별 menu.ts 주입.

// 트레일링 슬래시 정규화('/student/' → '/student'). 루트('/')는 그대로 둔다.
const norm = (p: string) =>
  p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p

// 경로가 항목의 to(또는 match prefix)에 해당하는지. end면 정확 일치만, 아니면 prefix 일치.
function pathMatches(pathname: string, base: string, end: boolean) {
  const p = norm(pathname)
  const b = norm(base)
  if (end) return p === b
  return p === b || p.startsWith(b + '/')
}

export function Sidebar({
  label,
  items,
}: {
  label: string
  items: MenuItem[]
}) {
  const { pathname } = useLocation()
  // 로고 클릭 → 역할 메인(첫 메뉴 = 대시보드)
  const home = items[0]?.to ?? '/'

  return (
    <aside className="border-border flex w-[200px] shrink-0 flex-col overflow-y-auto border-r bg-white">
      <Link
        to={home}
        aria-label="메인으로"
        className="px-5 pt-6 pb-4 text-xl font-bold tracking-tight"
      >
        <span className="text-brand">PLAY</span>
        <span className="text-accent">DATA</span>
      </Link>
      {label && (
        <span className="text-fg-subtle px-5 pb-1 text-[10px] font-semibold">
          {label}
        </span>
      )}
      <nav className="flex flex-col gap-0.5 px-3 py-1">
        {items.map((item) => {
          // 하위 메뉴를 가진 항목(예: 대시보드 '/student')만 정확 매칭, 나머지는 prefix.
          const end = items.some(
            (o) => o.to !== item.to && o.to.startsWith(item.to + '/'),
          )
          // to 매칭 + match에 등록된 추가 경로 매칭(예: 나의 과정 ← /student/quizzes)
          // + 루트('/')는 RoleEntry가 역할 홈으로 보내므로 홈(첫 항목=대시보드)을 활성으로 본다.
          const active =
            pathMatches(pathname, item.to, end) ||
            (item.match?.some((m) => pathMatches(pathname, m, false)) ??
              false) ||
            (item.to === home && norm(pathname) === '/')
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`relative rounded-md px-3 py-2 text-[13px] ${
                active
                  ? 'bg-accent-bg text-accent-strong font-semibold'
                  : 'text-fg hover:bg-divider font-medium'
              }`}
            >
              {active && (
                <span className="bg-accent absolute top-1/2 left-0 h-[18px] w-[3px] -translate-y-1/2 rounded-full" />
              )}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
