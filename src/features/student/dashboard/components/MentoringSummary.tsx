import type { DashboardMentoring } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'

// 멘토링 요약 — 대기/예약/완료/최근 카운트 타일 4개.
export function MentoringSummary({
  mentoring,
}: {
  mentoring: DashboardMentoring
}) {
  const tiles = [
    { label: '대기', value: mentoring.waiting },
    { label: '예약', value: mentoring.reserved },
    { label: '완료', value: mentoring.completed },
    { label: '최근 활동', value: mentoring.recent },
  ]
  return (
    <SectionCard
      title="멘토링 요약"
      action={<MoreLink to="/student/mentoring" label="멘토링 보기" />}
    >
      <div className="grid grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="bg-surface-muted flex flex-col items-center gap-1 rounded-lg py-4"
          >
            <span className="text-fg text-2xl font-bold">{t.value}</span>
            <span className="text-fg-muted text-xs">{t.label}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
