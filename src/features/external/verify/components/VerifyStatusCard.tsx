import type { ReactNode } from 'react'
import { VERIFY_TONES, type VerifyTone } from './tones'

export interface VerifyStatusRow {
  label: string
  value: ReactNode
  /** 있으면 행이 '32px 틴트 아이콘 타일 + 라벨/값 세로' 변형(Figma 541:2907)으로 렌더된다. */
  icon?: ReactNode
  iconTone?: VerifyTone
}

/**
 * /verify 상태 화면 공유 상태 카드 — 행 단위 두 변형.
 * ① 라벨/값 우측정렬 행(Figma 3198:168 — 진입·미인증) ② 아이콘 타일 행(Figma 541:2907 — 비공개).
 */
export function VerifyStatusCard({
  rows,
  radius = 18,
}: {
  rows: VerifyStatusRow[]
  /** Figma 라디우스 — 진입·미인증 18 / 비공개 14. */
  radius?: 18 | 14
}) {
  const hasIcon = rows.some((row) => row.icon)
  return (
    <div
      className={`border-border bg-surface flex w-full flex-col border shadow-[0_12px_28px_rgba(15,23,42,0.05)] ${
        radius === 14 ? 'rounded-[14px]' : 'rounded-[18px]'
      } ${hasIcon ? 'divide-divider divide-y' : 'gap-2.5 px-6 py-[18px]'}`}
    >
      {rows.map((row) =>
        row.icon ? (
          <div key={row.label} className="flex items-center gap-3 px-4 py-3">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                VERIFY_TONES[row.iconTone ?? 'info'].bg
              } ${VERIFY_TONES[row.iconTone ?? 'info'].text}`}
            >
              {row.icon}
            </span>
            <span className="flex flex-col gap-px text-left">
              <span className="text-fg-subtle text-[10px] font-medium tracking-[0.6px]">
                {row.label}
              </span>
              <span className="text-fg text-[13px] font-bold">{row.value}</span>
            </span>
          </div>
        ) : (
          <div
            key={row.label}
            className="flex h-8 items-center justify-between gap-4"
          >
            <span className="text-fg-subtle w-[150px] shrink-0 text-[10px] font-medium">
              {row.label}
            </span>
            <span className="text-fg text-right text-[13px] font-bold">
              {row.value}
            </span>
          </div>
        ),
      )}
    </div>
  )
}
