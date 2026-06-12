import type { ReactNode } from 'react'
import { VERIFY_TONES, type VerifyTone } from './tones'

/**
 * 80px 원형 상태 아이콘 — Figma 3198:164. 상태별 톤 변형(로딩 '...'·체크·자물쇠 등).
 * 진입 로딩의 '...'은 디자인이 정적 텍스트라 그대로 둔다(스피너 전환은 회고 안건).
 */
export function VerifyStatusIcon({
  tone,
  children,
}: {
  tone: VerifyTone
  children: ReactNode
}) {
  const t = VERIFY_TONES[tone]
  return (
    <span
      className={`flex size-20 items-center justify-center rounded-full border text-[34px] font-bold ${t.bg} ${t.border} ${t.text}`}
    >
      {children}
    </span>
  )
}
