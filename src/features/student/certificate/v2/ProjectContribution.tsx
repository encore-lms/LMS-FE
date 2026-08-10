import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { CertProjectActivity } from '../types'

export interface ProjectContributionActivity extends CertProjectActivity {
  selectorLabel?: string
  repositoryTotalCommits?: number
  metricLabel?: string
  metricValue?: string
  note?: string
}

// 증명서 v2 — 프로젝트별 커밋 잔디밭(선택형). 한 프로젝트 레포의 커밋만 일별로 표시.
// 활동일·최장 연속·주 평균으로 "꾸준한 참여(일관성)"를 정량 증명.
const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

function cell(c: number) {
  if (c <= 0) return 'bg-surface-muted'
  if (c <= 2) return 'bg-brand/30'
  if (c <= 4) return 'bg-brand/60'
  return 'bg-brand'
}

export function ProjectContribution({
  activities,
  className,
}: {
  activities: ProjectContributionActivity[]
  className?: string
}) {
  const [sel, setSel] = useState(0)
  const a = activities[sel] ?? activities[0]
  if (!a) return null
  const pct = Math.round((a.activeDays / a.totalDays) * 100)
  const stats = [
    {
      label: a.repositoryTotalCommits === undefined ? '총 커밋' : '내 커밋',
      value: `${a.totalCommits}`,
    },
    ...(a.repositoryTotalCommits === undefined
      ? []
      : [{ label: '전체 커밋', value: `${a.repositoryTotalCommits}` }]),
    { label: '활동 기간', value: a.weeksLabel },
    {
      label: '활동일',
      value: `${a.activeDays}/${a.totalDays}일`,
      sub: `${pct}%`,
    },
    { label: '최장 연속', value: `${a.longestStreak}일` },
    { label: '주 평균', value: `${a.weeklyAvg}` },
    {
      label: a.metricLabel ?? '기여도',
      value: a.metricValue ?? a.contrib,
    },
  ]

  return (
    <section className={cn(card, 'flex flex-col gap-4', className)}>
      <div className="flex flex-col">
        <span className="text-fg text-[15px] font-bold">
          프로젝트 커밋 활동
        </span>
        <span className="text-fg-subtle text-[11px]">
          저장소를 선택하면 분석 브랜치의 커밋 활동과 커밋 기여율을 표시
        </span>
      </div>

      {/* 프로젝트 셀렉터 */}
      <div className="flex flex-wrap gap-2">
        {activities.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSel(i)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors',
              i === sel
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border text-fg-muted hover:bg-surface-muted',
            )}
          >
            {p.certified && '✓ '}
            {p.selectorLabel ?? p.name.split(' — ')[0]}
          </button>
        ))}
      </div>

      {/* 선택 프로젝트 헤더 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-fg text-[14px] font-bold">{a.name}</span>
        <span className="text-fg-subtle text-[11px]">
          {a.period} · {a.weeksLabel}
        </span>
        {a.certified && (
          <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-bold">
            ✓ 인증
          </span>
        )}
      </div>

      {/* 잔디밭 (열=주, 행=요일) */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {a.grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((c, di) => (
              <span
                key={di}
                className={cn('size-3 shrink-0 rounded-[2px]', cell(c))}
                title={`${c} 커밋`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="text-fg-subtle flex items-center gap-1.5 text-[10px]">
        적음
        <span className="bg-surface-muted size-3 rounded-[2px]" />
        <span className="bg-brand/30 size-3 rounded-[2px]" />
        <span className="bg-brand/60 size-3 rounded-[2px]" />
        <span className="bg-brand size-3 rounded-[2px]" />
        많음
      </div>

      {/* 참여 일관성 지표 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border-border bg-surface flex flex-col gap-0.5 rounded-xl border p-3"
          >
            <span className="text-fg-subtle text-[11px]">{s.label}</span>
            <span className="text-fg text-[16px] font-bold">{s.value}</span>
            {s.sub && (
              <span className="text-brand text-[10px] font-semibold">
                {s.sub}
              </span>
            )}
          </div>
        ))}
      </div>

      <span className="text-fg-muted text-[11px]">
        {a.note ??
          'ⓘ 선택한 프로젝트 레포의 커밋만 집계했습니다. 활동일·최장 연속·주 평균으로 꾸준한 참여를 확인할 수 있습니다.'}
      </span>
    </section>
  )
}
