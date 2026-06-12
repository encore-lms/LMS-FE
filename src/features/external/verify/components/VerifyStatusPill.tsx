import type { ReactNode } from 'react'
import { VERIFY_TONES, type VerifyTone } from './tones'

/** 상태 알약(dot + 라벨) — Figma 3198:161. 8px dot은 이미지 에셋 대신 CSS 원으로 구현. */
export function VerifyStatusPill({
  tone,
  children,
}: {
  tone: VerifyTone
  children: ReactNode
}) {
  const t = VERIFY_TONES[tone]
  return (
    <span
      className={`flex h-8 items-center gap-2 rounded-full border pr-3.5 pl-3 text-xs font-bold ${t.bg} ${t.border} ${t.text}`}
    >
      <span className={`size-2 rounded-full ${t.dot}`} aria-hidden />
      {children}
    </span>
  )
}
