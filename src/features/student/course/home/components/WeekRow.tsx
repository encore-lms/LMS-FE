import { cn } from '@/shared/lib/cn'
import type { CourseWeek, WeekStatus } from '../../types'

// 주차별 학습 한 줄 — 주차 번호 박스 · 제목/기간 · 상태 배지. 학습 중은 행 전체 강조.
const STATUS: Record<WeekStatus, { label: string; badge: string }> = {
  done: { label: '완료', badge: 'bg-success-bg text-success' },
  learning: { label: '학습 중', badge: 'bg-brand/10 text-brand' },
  upcoming: { label: '예정', badge: 'bg-surface-muted text-fg-subtle' },
}

export function WeekRow({ week }: { week: CourseWeek }) {
  const active = week.status === 'learning'
  const status = STATUS[week.status]
  const topics = week.topics ?? []
  // 커리큘럼이 있으면 제목이 "N주차"가 아니라 교과목이므로 주차 번호를 기간 줄에 남긴다.
  const hasCurriculum = (week.subjects ?? []).length > 0
  return (
    <div
      className={cn(
        'flex w-full items-center gap-3.5 rounded-[12px] p-4',
        active ? 'bg-brand/10' : '',
      )}
    >
      <div
        className={cn(
          'flex size-12 flex-col items-center justify-center rounded-[12px] text-center',
          active ? 'bg-brand text-white' : 'bg-surface-muted',
        )}
      >
        <span
          className={cn(
            'text-[9px] font-medium tracking-[0.08em]',
            active ? 'text-white/80' : 'text-fg-subtle',
          )}
        >
          W
        </span>
        <span
          className={cn(
            'text-[18px] leading-5 font-bold',
            active ? 'text-white' : 'text-fg',
          )}
        >
          {week.weekNo}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-fg text-[14px] font-semibold">{week.title}</span>
        {/* 커리큘럼이 설정된 주차는 제목이 교과목이라, 그 주 세부 주제를 한 줄 더 보여준다. */}
        {topics.length > 0 && (
          <span className="text-fg-muted truncate text-[12px]">
            {topics.join(' · ')}
          </span>
        )}
        <span className="text-fg-subtle text-[11px]">
          {hasCurriculum && `${week.weekNo}주차 · `}
          {week.periodStart} — {week.periodEnd}
        </span>
      </div>
      <span
        className={cn(
          'rounded-md px-2.5 py-1 text-[11px] font-bold',
          status.badge,
        )}
      >
        {status.label}
      </span>
    </div>
  )
}
