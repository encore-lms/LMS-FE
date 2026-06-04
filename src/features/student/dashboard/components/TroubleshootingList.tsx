import { Link } from 'react-router-dom'
import type { DashboardTroubleshooting } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'
import { Chip } from './Chip'

// 최근 트러블슈팅 — 태그 + 제목 + 날짜. 본인 최근 작성분.
export function TroubleshootingList({
  items,
}: {
  items: DashboardTroubleshooting[]
}) {
  return (
    <SectionCard
      title="최근 트러블슈팅"
      action={<MoreLink to="/student/troubleshooting" />}
    >
      {items.length === 0 ? (
        <p className="text-fg-subtle py-4 text-center text-sm">
          최근 트러블슈팅이 없어요
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((t) => (
            <li key={t.id}>
              <Link
                to={t.to}
                className="hover:bg-surface-muted -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Chip>{t.tag}</Chip>
                  <span className="text-fg truncate text-sm">{t.title}</span>
                </span>
                <span className="text-fg-subtle shrink-0 text-xs">
                  {t.date}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
