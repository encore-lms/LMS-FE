import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import {
  isMenuGroup,
  type MenuGroup,
  type MenuItem,
  type MenuNode,
} from './types'

// 사이드바 — Figma 디자인 반영(로고·섹션 라벨·활성 보라 액센트). 메뉴는 역할별 menu.ts 주입.
// 항목이 많은 역할(운영)은 menu.ts에서 MenuGroup(대분류)로 묶으면 접이식 드롭다운으로 렌더된다.
// flat 메뉴(학생/강사/멘토)는 leaf만 넘기면 기존과 동일하게 평면 렌더된다.

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

// 대분류(드롭다운) — 자식 중 활성 항목이 있으면 기본 펼침, 사용자가 토글하면 그 상태를 따른다.
function NavGroup({
  group,
  hasActive,
  renderLeaf,
}: {
  group: MenuGroup
  hasActive: boolean
  renderLeaf: (item: MenuItem, nested?: boolean) => ReactNode
}) {
  // null = 자동(활성 자식 따라감), boolean = 사용자가 명시적으로 토글한 상태.
  const [override, setOverride] = useState<boolean | null>(null)
  const expanded = override ?? hasActive

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => setOverride(!expanded)}
        aria-expanded={expanded}
        className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-[13px] ${
          hasActive
            ? 'text-accent-strong font-semibold'
            : 'text-fg hover:bg-divider font-medium'
        }`}
      >
        <span>{group.label}</span>
        <ChevronDown
          className={`text-fg-subtle h-3.5 w-3.5 shrink-0 transition-transform ${
            expanded ? '' : '-rotate-90'
          }`}
        />
      </button>
      {expanded && group.children.map((child) => renderLeaf(child, true))}
    </div>
  )
}

export function Sidebar({
  label,
  items,
}: {
  label: string
  items: MenuNode[]
}) {
  const { pathname } = useLocation()
  // 모든 leaf(그룹 안 항목 포함) — 첫 leaf=역할 홈, prefix 겹침 판정용.
  const leaves = items.flatMap((node) =>
    isMenuGroup(node) ? node.children : [node],
  )
  // 로고 클릭 → 역할 메인(첫 leaf = 대시보드)
  const home = leaves[0]?.to ?? '/'

  // 항목 활성 여부 — 하위 메뉴를 가진 항목만 정확 매칭, 나머지는 prefix + match + 루트('/') 보정.
  const isActive = (item: MenuItem) => {
    const end = leaves.some(
      (o) => o.to !== item.to && o.to.startsWith(item.to + '/'),
    )
    return (
      pathMatches(pathname, item.to, end) ||
      (item.match?.some((m) => pathMatches(pathname, m, false)) ?? false) ||
      (item.to === home && norm(pathname) === '/')
    )
  }

  const renderLeaf = (item: MenuItem, nested = false): ReactNode => {
    const active = isActive(item)
    return (
      <Link
        key={item.to}
        to={item.to}
        aria-current={active ? 'page' : undefined}
        className={`relative rounded-md py-2 text-[13px] ${
          nested ? 'pr-3 pl-7' : 'px-3'
        } ${
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
  }

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
        {items.map((node) =>
          isMenuGroup(node) ? (
            <NavGroup
              key={node.label}
              group={node}
              hasActive={node.children.some(isActive)}
              renderLeaf={renderLeaf}
            />
          ) : (
            renderLeaf(node)
          ),
        )}
      </nav>
    </aside>
  )
}
