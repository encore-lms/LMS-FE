import { useMemo, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { TONE_SOLID, TONE_TEXT } from '@/shared/lib/tone'
import type { CertDomain } from '../types'

// 증명서 v2 — 인증 완료 프로젝트의 도메인 분포. 토큰 색만 사용한다.
const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'
const R = 52
const C = 2 * Math.PI * R
// 조각 사이 균일한 틈 — 어느 조각이 선택돼도 이음새가 흐트러지지 않는다.
const SEG_GAP = 3
// 두께는 선택과 무관하게 고정한다(선택 시 두께가 변하면 도넛 형태가 울렁인다 — 08-10 반려).
const SEG_WIDTH = 17
const domainCollator = new Intl.Collator(['ko', 'en'], {
  numeric: true,
  sensitivity: 'base',
})

export function DomainDonut({
  domains,
  className,
  compact = false,
}: {
  domains: CertDomain[]
  className?: string
  compact?: boolean
}) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const sortedDomains = useMemo(
    () =>
      [...domains].sort(
        (a, b) => b.pct - a.pct || domainCollator.compare(a.label, b.label),
      ),
    [domains],
  )
  const segments = useMemo(() => {
    let offset = 0
    return sortedDomains.map((domain) => {
      const length = (domain.pct / 100) * C
      const segment = { domain, length, offset }
      offset += length
      return segment
    })
  }, [sortedDomains])
  const selected =
    sortedDomains.find((domain) => domain.label === selectedLabel) ??
    sortedDomains[0]

  return (
    <section
      data-domain-compact={compact || undefined}
      className={cn(
        card,
        'flex flex-col',
        compact ? 'gap-3 p-4' : 'gap-5',
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-[15px] font-bold">도메인 경험</span>
        <span className="text-fg-muted text-[11px]">
          인증 완료 프로젝트의 도메인 분포
        </span>
      </div>

      {sortedDomains.length === 0 ? (
        <div
          className="bg-surface-muted text-fg-muted rounded-lg px-4 py-8 text-center text-[12px]"
          data-domain-empty
        >
          도메인이 등록된 인증 완료 프로젝트가 없습니다.
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center',
            compact
              // 좁은 화면에서는 도넛 아래로 목록을 내린다 — 132px 고정 컬럼을 그대로
              // 두면 가로 스크롤이 생긴다(공개 검증 500px 에서 84px 넘침).
              ? 'grid grid-cols-1 gap-3 sm:grid-cols-[132px_minmax(0,1fr)]'
              : 'flex-col gap-8 lg:flex-row lg:justify-center lg:gap-14',
          )}
        >
          <div
            className={cn(
              'flex w-full flex-col items-center',
              compact ? 'gap-1.5' : 'max-w-[280px] gap-3',
            )}
          >
            <svg
              viewBox="0 0 140 140"
              className={cn(
                'shrink-0',
                compact ? 'size-[124px]' : 'size-[190px]',
              )}
              role="group"
              aria-label="도메인 경험 비율 도넛"
            >
              <circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                className="stroke-surface-muted"
                strokeWidth="16"
              />
              <g transform="rotate(-90 70 70)">
                {segments.map(({ domain, length, offset }) => {
                  const isSelected = selected.label === domain.label
                  return (
                    <circle
                      key={domain.label}
                      cx="70"
                      cy="70"
                      r={R}
                      fill="none"
                      stroke="currentColor"
                      className={cn(
                        TONE_TEXT[domain.tone],
                        'cursor-pointer transition-opacity duration-200 outline-none',
                        !isSelected && 'opacity-40 hover:opacity-75',
                      )}
                      strokeWidth={SEG_WIDTH}
                      strokeDasharray={`${Math.max(length - SEG_GAP, 1)} ${C - Math.max(length - SEG_GAP, 1)}`}
                      strokeDashoffset={-(offset + SEG_GAP / 2)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${domain.label} ${domain.pct}%`}
                      aria-pressed={isSelected}
                      data-domain-segment={domain.label}
                      onClick={() => setSelectedLabel(domain.label)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedLabel(domain.label)
                        }
                      }}
                    />
                  )
                })}
              </g>
              {/* 중앙 = 선택 도메인 요약 — 별도 상세 카드 없이 도넛 안에서 답한다. */}
              <g data-domain-detail={selected.label} className="pointer-events-none">
                <text
                  x="70"
                  y="62"
                  textAnchor="middle"
                  fill="currentColor"
                  className={cn(TONE_TEXT[selected.tone], 'text-[19px] font-extrabold')}
                >
                  {selected.pct}%
                </text>
                <text
                  x="70"
                  y="77"
                  textAnchor="middle"
                  className="fill-fg text-[8.5px] font-bold"
                >
                  {selected.label}
                </text>
                {selected.projectCount !== undefined && (
                  <text
                    x="70"
                    y="89"
                    textAnchor="middle"
                    className="fill-fg-muted text-[8px]"
                  >
                    인증 프로젝트 {selected.projectCount}개
                  </text>
                )}
              </g>
            </svg>
          </div>

          <div
            className={cn('flex w-full flex-col', !compact && 'max-w-[520px]')}
            aria-label="도메인 경험 순위"
          >
            {sortedDomains.map((domain, index) => {
              const isSelected = selected.label === domain.label
              return (
                <button
                  key={domain.label}
                  type="button"
                  className={cn(
                    'border-divider flex items-center border-b text-left transition-colors last:border-b-0',
                    compact
                      ? 'min-h-8 gap-2 px-2 text-[11px]'
                      : 'min-h-12 gap-3 px-3 text-[13px]',
                    isSelected
                      ? 'bg-surface-muted rounded-md'
                      : 'hover:bg-surface-muted/60',
                  )}
                  aria-pressed={isSelected}
                  data-domain-list-item={domain.label}
                  onClick={() => setSelectedLabel(domain.label)}
                >
                  <span className="text-fg-subtle w-4 text-[10px] font-bold">
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      'size-2.5 shrink-0 rounded-sm',
                      TONE_SOLID[domain.tone],
                    )}
                  />
                  <span className="text-fg min-w-0 flex-1 truncate font-medium">
                    {domain.label}
                  </span>
                  {domain.projectCount !== undefined && (
                    <span className="text-fg-subtle text-[11px]">
                      {domain.projectCount}개
                    </span>
                  )}
                  <span className="text-fg w-12 text-right font-bold">
                    {domain.pct}%
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
