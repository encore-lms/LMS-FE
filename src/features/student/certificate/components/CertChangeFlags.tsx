import { cn } from '@/shared/lib/cn'
import type { CertChangeFlag } from '../types'
import { TONE_SOFT, TONE_SOLID } from '@/shared/lib/tone'

// 보완이 필요한 항목 — 미리보기 상단 경고 카드들(좌측 색 바 + 배지 + 이동). Figma 249:27.

export function CertChangeFlags({
  flags,
  onCta,
}: {
  flags: CertChangeFlag[]
  onCta: (cta: string) => void
}) {
  if (flags.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <h2 className="text-fg text-[16px] font-bold">보완이 필요한 항목</h2>
          <span className="text-fg-subtle text-[12px]">
            정식 인증 요청 전 처리 권장 · 총 {flags.length}건
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">최근 갱신 03:12</span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {flags.map((f) => (
          <div
            key={f.id}
            className="border-border bg-surface flex overflow-hidden rounded-[12px] border"
          >
            <span className={cn('w-1.5 shrink-0', TONE_SOLID[f.badgeTone])} />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-bold',
                    TONE_SOFT[f.badgeTone],
                  )}
                >
                  {f.badge}
                </span>
                <span className="text-fg text-[13px] font-bold">{f.title}</span>
              </div>
              <span className="text-fg-muted text-[12px] leading-5">
                {f.detail}
              </span>
              <button
                type="button"
                onClick={() => onCta(f.cta)}
                className="text-brand w-fit text-[12px] font-semibold"
              >
                {f.cta} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
