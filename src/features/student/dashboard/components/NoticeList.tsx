import { Megaphone } from 'lucide-react'
import type { DashboardNotice } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'
import { Chip } from './Chip'
import { EmptyState } from './EmptyState'

// 공지 — 운영/강사 공지(기수 단위). 태그(색) + 날짜 + 제목 + 상대시간.
export function NoticeList({ notices }: { notices: DashboardNotice[] }) {
  return (
    <SectionCard
      icon={Megaphone}
      title="공지"
      subtitle="총 12건 · 최근 30일"
      action={<MoreLink to="/student/notices" label="전체" />}
    >
      {notices.length === 0 ? (
        <EmptyState icon={Megaphone} title="새 공지가 없어요" />
      ) : (
        <ul className="flex flex-col">
          {notices.map((n) => (
            <li
              key={n.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Chip tone={n.tagTone}>{n.tag}</Chip>
                <span className="text-fg-subtle shrink-0 text-xs">
                  {n.dateLabel}
                </span>
                <span className="text-fg truncate text-sm">{n.title}</span>
              </span>
              <span className="text-fg-subtle shrink-0 text-xs">
                {n.relativeTime}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
