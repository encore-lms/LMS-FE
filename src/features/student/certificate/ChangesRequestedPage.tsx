import { Fragment } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useCertChanges } from '../api/certificate'
import type { Tone } from './types'

// 보완 요청 상세 (/student/certificate/changes-requested) — Figma 248:27.
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const SOLID: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const card =
  'border-border bg-surface rounded-[14px] border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

export default function ChangesRequestedPage() {
  const { data, isPending, isError, refetch } = useCertChanges()
  if (isPending)
    return <div className="text-fg-muted p-8">보완 요청을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="보완 요청을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-5 p-8 pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-[22px] font-bold">보완 요청</h1>
        <p className="text-fg-muted text-[12px]">
          정식 인증 검토 후 보완 사항을 확인하고 재요청하세요
        </p>
      </div>

      {/* 요약 배너 */}
      <section className="border-danger flex items-center gap-4 rounded-2xl border p-5">
        <span className="bg-danger-bg text-danger flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl">
          ⚠
        </span>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="bg-danger-bg text-danger rounded px-2 py-0.5 text-[11px] font-bold">
              보완 요청
            </span>
            <span className="text-fg-subtle text-[12px]">
              {data.roundLabel}
            </span>
          </div>
          <span className="text-fg text-[18px] font-bold">
            {data.summaryTitle}
          </span>
          <span className="text-fg-muted text-[12px]">{data.summarySub}</span>
        </div>
      </section>

      {/* 보완 요청 사유 */}
      <div className="flex items-center gap-2">
        <h2 className="text-fg text-[15px] font-bold">보완 요청 사유</h2>
        <span className="bg-surface-muted text-fg-muted rounded px-2 py-0.5 text-[11px] font-bold">
          {data.reasons.length}건
        </span>
        <span className="text-fg-subtle text-[11px]">
          각 항목의 코멘트를 확인하고 수정 후 돌아오세요
        </span>
      </div>
      {data.reasons.map((r) => (
        <section key={r.id} className={cn(card, 'flex items-center gap-4')}>
          <span className="bg-brand-deep flex size-7 shrink-0 items-center justify-center rounded-md text-[13px] font-bold text-white">
            {r.no}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {r.tags.map((tg, i) => (
                <span
                  key={i}
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-bold',
                    CHIP[tg.tone],
                  )}
                >
                  {tg.label}
                </span>
              ))}
            </div>
            <span className="text-fg text-[14px] font-bold">{r.title}</span>
            <span className="text-fg-muted text-[12px] leading-5">
              {r.detail}
            </span>
          </div>
          <button
            type="button"
            className="bg-brand shrink-0 rounded-lg px-4 py-2.5 text-[12px] font-bold text-white"
          >
            {r.actionLabel} →
          </button>
        </section>
      ))}

      {/* 관련 영역 바로가기 */}
      <div className="flex flex-col gap-1 pt-1">
        <h2 className="text-fg text-[15px] font-bold">관련 영역 바로가기</h2>
        <span className="text-fg-subtle text-[11px]">
          보완 사항이 있는 5개 영역으로 바로 이동할 수 있습니다
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {data.relatedAreas.map((a) => (
          <div
            key={a.id}
            className="border-border bg-surface flex flex-col gap-2 rounded-[12px] border p-4"
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-lg text-[12px] font-bold text-white',
                  SOLID[a.letterTone],
                )}
              >
                {a.letter}
              </span>
              <span
                className={cn(
                  'size-2 rounded-full',
                  a.done ? 'bg-success' : 'bg-danger',
                )}
              />
            </div>
            <span className="text-fg text-[13px] font-bold">{a.label}</span>
            <span className="text-fg-subtle text-[11px]">{a.status}</span>
            <span className="text-brand text-[11px] font-semibold">이동 →</span>
          </div>
        ))}
      </div>

      {/* 재요청 체크리스트 */}
      <section className={cn(card, 'flex flex-col gap-0 p-0')}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex flex-col">
            <span className="text-fg text-[15px] font-bold">
              정식 인증 재요청 체크리스트
            </span>
            <span className="text-fg-subtle text-[11px]">
              모든 항목이 완료되어야 재요청 버튼이 활성화됩니다
            </span>
          </div>
          <span className="bg-danger-bg text-danger rounded-full px-3 py-1 text-[12px] font-bold">
            {data.checkDoneLabel} 완료
          </span>
        </div>
        {data.checklist.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && <div className="bg-divider h-px w-full" />}
            <div className="flex items-center gap-3 px-5 py-3.5">
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                  c.done
                    ? 'bg-success text-white'
                    : 'border-border text-fg-subtle border',
                )}
              >
                {c.done ? '✓' : ''}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-fg text-[13px] font-semibold">
                  {c.label}
                </span>
                <span className="text-fg-muted text-[11px]">{c.sub}</span>
              </div>
              {!c.done && (
                <span className="bg-danger-bg text-danger shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold">
                  미반영
                </span>
              )}
              {c.actionLabel && (
                <span className="text-brand shrink-0 text-[12px] font-semibold">
                  {c.actionLabel} →
                </span>
              )}
            </div>
          </Fragment>
        ))}
      </section>

      {/* 하단 액션바 */}
      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold">
            재요청 전 체크 {data.checkDoneLabel} 완료 — 모든 보완 사유 처리 후
            재요청 가능
          </span>
          <span className="text-[11px] text-white/70">
            정식 인증 재요청 시 매니저가 1영업일 이내 검토합니다
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            증명서 미리보기
          </button>
          <button
            type="button"
            className="bg-surface-muted text-fg-subtle rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            정식 인증 재요청 ({data.reasons.length}건 보완 필요)
          </button>
        </div>
      </div>
    </div>
  )
}
