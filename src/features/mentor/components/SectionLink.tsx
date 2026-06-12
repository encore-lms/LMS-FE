import { Link } from 'react-router-dom'

// 섹션 우측 brand 링크 — Figma '라벨 →' 패턴(SemiBold 11~12 brand).
export function SectionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="text-brand text-xs font-semibold whitespace-nowrap hover:underline"
    >
      {label} →
    </Link>
  )
}
