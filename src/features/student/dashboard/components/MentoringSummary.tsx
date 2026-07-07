import { Link } from 'react-router-dom'
import { HeartHandshake } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { DashboardMentoring, Tone } from '../types'
import { SectionCard } from './SectionCard'
import { TONE_TEXT } from './tone'

// 멘토링 요약 — 통계 4셀(라벨+캡션+색상 숫자) + 안내 셀. 색은 @theme 토큰.
const CELL_BG: Record<Tone, string> = {
  neutral: 'bg-surface-muted',
  brand: 'bg-success-bg',
  success: 'bg-success-bg',
  warning: 'bg-warning-bg',
  danger: 'bg-danger-bg',
  info: 'bg-info-bg',
  accent: 'bg-accent-bg',
}

export function MentoringSummary({
  mentoring,
}: {
  mentoring: DashboardMentoring
}) {
  return (
    <SectionCard
      icon={HeartHandshake}
      title="멘토링 요약"
      subtitle="요청 대기 · 조정 제안 · 확정 예약 · 최근 완료 요약합니다"
      action={
        <Link
          to="/student/mentoring"
          className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          멘토링 보기 →
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {mentoring.stats.map((s) => (
          <div
            key={s.key}
            className={cn(
              'flex items-center justify-between gap-2 rounded-xl px-4 py-3.5',
              CELL_BG[s.tone],
            )}
          >
            <span className="flex min-w-0 flex-col">
              <span className="text-fg truncate text-sm font-semibold">
                {s.label}
              </span>
              <span className="text-fg-muted truncate text-[11px]">
                {s.caption}
              </span>
            </span>
            <span
              className={cn('shrink-0 text-2xl font-bold', TONE_TEXT[s.tone])}
            >
              {s.value}
            </span>
          </div>
        ))}
        <div className="col-span-2 flex flex-col justify-center px-4 py-3.5 lg:col-span-1">
          <span className="text-fg-muted text-xs font-semibold">
            {mentoring.note.title}
          </span>
          <span className="text-fg-subtle text-[11px]">
            {mentoring.note.caption}
          </span>
        </div>
      </div>
    </SectionCard>
  )
}
