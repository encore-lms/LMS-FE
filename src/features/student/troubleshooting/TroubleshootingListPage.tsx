import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  FileText,
  Flag,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useTsList } from '../api/troubleshooting'
import type { Tone, TsCase, TsStatus } from './types'

// 트러블슈팅 사례 목록 (/student/troubleshooting) — Figma 360:1297.
// 통계카드 우상단 아이콘(노트/체크/깃발/스톱워치) — 키별 매핑.
const STAT_ICON: Record<string, LucideIcon> = {
  total: FileText,
  certified: CheckCircle2,
  independent: Flag,
  avgdays: Timer,
}
const ICON_TEXT: Record<Tone, string> = {
  brand: 'text-brand',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent-strong',
  success: 'text-success',
}
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const ACCENT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const STATUS: Record<TsStatus, Tone> = {
  certified: 'success',
  reviewing: 'warning',
  draft: 'accent',
}

export default function TroubleshootingListPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useTsList()
  const [active, setActive] = useState('all')
  usePageHeader(
    '트러블슈팅',
    '겪어 해결한 사례를 상황·해결·결과로 기록하고 팀별 인증을 준비하세요.',
  )

  if (isPending)
    return <div className="text-fg-muted p-8">트러블슈팅을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const open = (c: TsCase) =>
    navigate(
      c.status === 'draft'
        ? `/student/troubleshooting/${c.id}`
        : `/student/troubleshooting/${c.id}`,
    )

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.stats.map((s) => {
          const Icon = STAT_ICON[s.key] ?? FileText
          return (
            <div key={s.key} className={cn(card, 'flex flex-col gap-2')}>
              <div className="flex items-start justify-between">
                <span className="text-fg-muted text-[12px]">{s.label}</span>
                <Icon className={cn('size-4 shrink-0', ICON_TEXT[s.tone])} />
              </div>
              <span className="text-fg text-[26px] leading-none font-bold">
                {s.value}
                {s.unit && (
                  <span className="text-fg-muted ml-0.5 text-[13px]">
                    {s.unit}
                  </span>
                )}
              </span>
              {s.barPct != null && (
                <div className="bg-surface-muted h-[5px] w-full overflow-hidden rounded-full">
                  <div
                    className={cn('h-full rounded-full', ACCENT[s.tone])}
                    style={{ width: `${s.barPct}%` }}
                  />
                </div>
              )}
              <span className="text-fg-subtle text-[11px]">{s.sub}</span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-[16px] font-bold">내 트러블슈팅 사례</h2>
          <span className="text-fg-subtle text-[12px]">
            {data.cases.length}건
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="border-border text-fg-subtle hidden items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] sm:inline-flex">
            <svg
              viewBox="0 0 24 24"
              className="size-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" strokeLinecap="round" />
            </svg>
            제목·카테고리·태그 검색
          </span>
          <button
            type="button"
            onClick={() => navigate('/student/troubleshooting/new')}
            className="bg-brand rounded-lg px-4 py-2.5 text-[13px] font-bold text-white"
          >
            + 새 사례 작성
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {data.filters.map((f) => {
            const on = f.key === active
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActive(f.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                  on
                    ? 'bg-brand-deep text-white'
                    : 'border-border text-fg-muted hover:bg-surface-muted border',
                )}
              >
                {f.label}
                <span
                  className={cn(
                    'text-[12px]',
                    on ? 'text-white/70' : 'text-fg-subtle',
                  )}
                >
                  {f.count}
                </span>
              </button>
            )
          })}
        </div>
        {/* 우측 상태 칩 (인증 완료·검토 중·작성 중) */}
        <div className="flex flex-wrap items-center gap-3">
          {data.statusFilters.map((f) => (
            <span
              key={f.key}
              className="text-fg-muted flex items-center gap-1.5 text-[12px] font-medium"
            >
              <span
                className={cn('size-2 rounded-full', ACCENT[f.tone ?? 'brand'])}
              />
              {f.label}
              <span className="text-fg font-bold">{f.count}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {data.cases.map((c) => (
          <section
            key={c.id}
            className="border-border bg-surface relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 pl-6"
          >
            <span
              className={cn(
                'absolute top-0 left-0 h-full w-1',
                ACCENT[c.accentTone],
              )}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[11px] font-bold',
                    CHIP[c.categoryTone],
                  )}
                >
                  {c.category}
                </span>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[11px] font-bold',
                    CHIP[STATUS[c.status]],
                  )}
                >
                  {c.statusLabel}
                </span>
                {c.independent && (
                  <span className="bg-brand/10 text-brand rounded px-2 py-0.5 text-[11px] font-bold">
                    ★ 독립 해결
                  </span>
                )}
                <span className="text-fg-subtle text-[11px]">⏱ {c.days}</span>
                {c.repLinked && (
                  <span className="text-fg-subtle text-[11px]">
                    🔗 대표 연결
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => open(c)}
                className={cn(
                  'shrink-0 rounded-lg px-4 py-2 text-[12px] font-bold',
                  c.status === 'draft'
                    ? 'bg-brand text-white'
                    : 'border-border text-fg-muted hover:bg-surface-muted border',
                )}
              >
                {c.actionLabel} →
              </button>
            </div>
            <h3 className="text-fg text-[16px] font-bold">{c.title}</h3>
            <span className="text-fg-subtle text-[11px]">
              {c.createdAt} · {c.updatedAt}
            </span>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {[
                { label: '상황', text: c.situation },
                { label: '해결', text: c.resolution },
                { label: '결과', text: c.result },
              ].map((b) => (
                <div
                  key={b.label}
                  className="bg-surface-muted/50 flex flex-col gap-1 rounded-[10px] p-3"
                >
                  <span className="text-fg-subtle text-[11px] font-bold">
                    {b.label}
                  </span>
                  <span className="text-fg-muted line-clamp-3 text-[12px] leading-5">
                    {b.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {c.tags.map((t) => (
                <span key={t} className="text-fg-muted text-[11px]">
                  {t}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-fg-subtle text-[12px]">{data.shownLabel}</span>
        <div className="flex items-center gap-1">
          <span className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px]">
            ‹
          </span>
          {['1', '2', '3', '4'].map((n) => (
            <span
              key={n}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-[13px] font-semibold',
                n === '1'
                  ? 'bg-brand-deep text-white'
                  : 'border-border text-fg-muted border',
              )}
            >
              {n}
            </span>
          ))}
          <span className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px]">
            ›
          </span>
        </div>
      </div>
    </div>
  )
}
