import type { DashboardNotice } from '../types'
import { SectionCard } from './SectionCard'
import { Chip } from './Chip'

// 공지 — 운영/강사 공지(기수 단위). 전용 화면이 없어 더보기 링크는 두지 않음.
export function NoticeList({ notices }: { notices: DashboardNotice[] }) {
  return (
    <SectionCard title="공지">
      {notices.length === 0 ? (
        <p className="text-fg-subtle py-4 text-center text-sm">공지가 없어요</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {notices.map((n) => (
            <li
              key={n.id}
              className="flex items-center justify-between gap-3 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Chip>{n.tag}</Chip>
                <span className="text-fg truncate text-sm">{n.title}</span>
              </span>
              <span className="text-fg-subtle shrink-0 text-xs">{n.date}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
