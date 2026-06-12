import type { ReactNode } from 'react'
import { VERIFY_TONES, type VerifyTone } from './tones'

/**
 * 상태 알약 — Figma 3198:161(진입 dot형)·2815:245(잘못된 링크 아이콘형)·541 비공개 변형 공유.
 * 8px dot은 이미지 에셋 대신 CSS 원으로 구현, icon을 주면 dot 대신 렌더(x-circle·자물쇠 등).
 */
export function VerifyStatusPill({
  tone,
  icon,
  children,
}: {
  tone: VerifyTone
  icon?: ReactNode
  children: ReactNode
}) {
  const t = VERIFY_TONES[tone]
  return (
    <span
      className={`flex h-8 items-center gap-2 rounded-full border pr-3.5 pl-3 text-xs font-bold ${t.bg} ${t.border} ${t.text}`}
    >
      {icon ?? <span className={`size-2 rounded-full ${t.dot}`} aria-hidden />}
      {children}
    </span>
  )
}
