import type { ReactNode } from 'react'
import { VERIFY_TONES, type VerifyTone } from './tones'

/**
 * 상태 칩 — 두 형태.
 * ① pill(기본): h32 알약 + 보더 — Figma 3198:161(진입 dot형)·미인증.
 * ② chip: rounded-7 사각 틴트 칩·무보더 — Figma 541:2907(비공개)·537:2905(잘못된 링크).
 * 8px dot은 이미지 에셋 대신 CSS 원으로 구현, icon을 주면 dot 대신 렌더(x-circle·자물쇠 등).
 */
export function VerifyStatusPill({
  tone,
  shape = 'pill',
  icon,
  children,
}: {
  tone: VerifyTone
  shape?: 'pill' | 'chip'
  icon?: ReactNode
  children: ReactNode
}) {
  const t = VERIFY_TONES[tone]
  const shapeClass =
    shape === 'chip'
      ? 'rounded-[7px] px-2.5 py-[5px]'
      : 'h-8 rounded-full border pr-3.5 pl-3 ' + t.border
  return (
    <span
      className={`flex items-center gap-2 text-xs font-bold ${shapeClass} ${t.bg} ${t.text}`}
    >
      {icon ?? <span className={`size-2 rounded-full ${t.dot}`} aria-hidden />}
      {children}
    </span>
  )
}
