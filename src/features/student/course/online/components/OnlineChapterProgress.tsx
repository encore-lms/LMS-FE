import { Lock, MonitorPlay } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { OnlineChapterView } from '../types'
import { OnlineProgressBar } from './OnlineProgressBar'

// 중앙 차시별 진도율 카드 — 참고 시안의 'Chapter Progress' 카드를 KDC 차시로 매핑.
// 제목 + 마지막 학습 시점 / 큰 진도율 % / 줄무늬 진행바 / 시청위치—총길이.
// 카드 클릭 시 해당 차시를 플레이어로 전환(onSelect). active면 테두리 강조.
// 잠김(locked) 차시는 진도율 대신 자물쇠/주차 안내를 보여준다(클릭 시 페이지가 토스트로 안내).
export function OnlineChapterProgress({
  chapter,
  active,
  onSelect,
}: {
  chapter: OnlineChapterView
  active: boolean
  onSelect: () => void
}) {
  const { locked } = chapter
  const pct = chapter.progressPct
  const started = pct > 0
  // 진도율 표기 — 소수 둘째 자리(시안 26,39% 재현). 정수면 정수로.
  const pctText = Number.isInteger(pct) ? `${pct}` : pct.toFixed(2)
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active}
      aria-disabled={locked}
      className={cn(
        'flex w-full flex-col gap-3 rounded-2xl border p-5 text-left shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)] transition-colors',
        locked
          ? 'border-border bg-surface-muted/40 cursor-not-allowed'
          : active
            ? 'border-brand bg-brand/5'
            : 'border-border bg-surface hover:border-brand/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-10 items-center justify-center rounded-xl',
              locked
                ? 'bg-surface-muted text-fg-subtle'
                : started
                  ? 'bg-brand/10 text-brand'
                  : 'bg-surface-muted text-fg-subtle',
            )}
          >
            {locked ? (
              <Lock className="size-5" />
            ) : (
              <MonitorPlay className="size-5" />
            )}
          </span>
          <div className="flex flex-col gap-0.5">
            <span
              className={cn(
                'text-[14px] font-bold',
                locked ? 'text-fg-muted' : 'text-fg',
              )}
            >
              {chapter.no}차시 · {chapter.title}
            </span>
            <span className="text-fg-subtle text-[11px]">
              {locked
                ? `${chapter.no}주차에 열리는 강의예요`
                : `마지막 학습: ${chapter.lastVisitLabel}`}
            </span>
          </div>
        </div>
        {locked ? (
          <span className="text-fg-subtle bg-surface-muted shrink-0 rounded-md px-2 py-1 text-[11px] font-bold">
            잠김
          </span>
        ) : (
          <span
            className={cn(
              'text-[28px] leading-none font-bold tabular-nums',
              started ? 'text-fg' : 'text-fg-subtle/60',
            )}
          >
            {pctText}
            <span className="text-[18px]">%</span>
          </span>
        )}
      </div>

      <OnlineProgressBar pct={locked ? 0 : pct} />

      <div className="text-fg-subtle flex items-center justify-between text-[11px] tabular-nums">
        <span>{locked ? '00:00' : chapter.watchedLabel}</span>
        <span>{chapter.durationLabel}</span>
      </div>
    </button>
  )
}
