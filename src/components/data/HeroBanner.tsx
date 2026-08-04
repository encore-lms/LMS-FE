import type { ReactNode } from 'react'

/**
 * 상세 화면 맨 위 띠 — 지금 보고 있는 것이 무엇이고 어디까지 왔는지 한 줄로 말한다.
 *
 * <p>수강생 강의 홈에서 시작해 운영 과정 상세가 그대로 쓰던 모양을, 값만 받는 형태로 꺼냈다.
 * 멘토 팀 상세도 같은 띠를 쓴다 — 역할마다 다른 화면처럼 보이면 같은 것을 놓고 이야기할 수
 * 없다. 배경은 brand 단색 통일(SSOT).</p>
 */
export function HeroBanner({
  eyebrow,
  title,
  meta,
  badgeLabel,
  badgeValue,
  progressPct,
  progressLabel,
  progressSubLabel,
}: {
  /** 맨 윗줄 작은 대문자 라벨(PLAYDATA CAMP 같은). */
  eyebrow: string
  title: ReactNode
  /** 제목 아래 한 줄 — 가운뎃점으로 나눌 조각들. 빈 값은 알아서 걸러진다. */
  meta: (string | null | undefined)[]
  /** 오른쪽 흰 배지 — 위 라벨과 아래 값. */
  badgeLabel: string
  badgeValue: string
  progressPct: number
  progressLabel: string
  progressSubLabel: string
}) {
  const parts = meta.filter((m): m is string => !!m && m.trim() !== '')
  const pct = Math.min(100, Math.max(0, Math.round(progressPct)))
  return (
    <section className="bg-brand flex w-full flex-col gap-[18px] rounded-2xl p-6 text-white shadow-[0px_8px_22px_0px_rgba(26,140,133,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-white/90">
            {eyebrow}
          </span>
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-medium text-white/90">
            {parts.map((part, i) => (
              <span key={part} className="flex items-center gap-2.5">
                {i > 0 && (
                  <span
                    className="size-1 rounded-full bg-white/90"
                    aria-hidden
                  />
                )}
                {part}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-surface flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-[10px] px-4 py-2 text-center">
          <span className="text-fg-muted text-[10px] tracking-[0.08em]">
            {badgeLabel}
          </span>
          <span className="text-brand text-lg font-bold">{badgeValue}</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <div className="flex w-full items-start justify-between gap-3 text-white">
          <span className="text-[12px] font-medium">{progressLabel}</span>
          <span className="text-[11px]">{progressSubLabel}</span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-white/25"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </section>
  )
}
