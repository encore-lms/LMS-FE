import { Link } from 'react-router-dom'
import type { DashboardTroubleshooting } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'
import { Chip } from './Chip'

// 최근 트러블슈팅 — 태그(색) + 제목 + 해결 체크 + 경과일. 본인 최근 작성분.
export function TroubleshootingList({
  items,
}: {
  items: DashboardTroubleshooting[]
}) {
  return (
    <SectionCard
      title="최근 트러블슈팅"
      subtitle="5건 · 독립 해결 4 · 동료 도움 1"
      action={<MoreLink to="/student/troubleshooting" label="트러블슈팅" />}
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
                <span className="flex min-w-0 items-center gap-2.5">
                  <Chip tone={t.tagTone}>{t.tag}</Chip>
                  <span className="text-fg truncate text-sm">{t.title}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs">
                  {t.resolved && (
                    <span className="bg-success-bg text-success grid size-4 place-items-center rounded-full text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                  <span className="text-fg-subtle">{t.dayLabel}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
