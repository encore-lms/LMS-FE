import { Link } from 'react-router-dom'

// 섹션 우측 "더보기" 링크 — 해당 도메인 화면으로 이동.
export function MoreLink({
  to,
  label = '전체 보기',
}: {
  to: string
  label?: string
}) {
  return (
    <Link
      to={to}
      className="text-fg-subtle hover:text-fg shrink-0 text-xs font-medium"
    >
      {label} →
    </Link>
  )
}
